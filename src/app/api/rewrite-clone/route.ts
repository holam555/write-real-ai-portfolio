import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { callGemini } from "@/lib/gemini"
import { countWords, MAX_WORDS, MAX_WORDS_PAID } from "@/lib/word-count"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { cleanRewriteOutput } from "@/lib/gemini-cleanup"

export async function POST(request: Request) {
  try {
    // Rate limit: max 20 rewrites per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("rewrite-clone", ip, 20, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "請求次數過多，請稍後再試。" },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "請先登入。" }, { status: 401 })
    }

    const { essay, language } = await request.json()
    const lang: "english" | "chinese" = language === "chinese" ? "chinese" : "english"

    if (!essay || typeof essay !== "string" || essay.trim().length === 0) {
      return NextResponse.json(
        { error: "請輸入要改寫的文章。" },
        { status: 400 }
      )
    }

    const wordCount = countWords(essay, lang)
    if (wordCount < 50) {
      return NextResponse.json(
        { error: "文章太短，請貼上至少 50 字的文章再試。" },
        { status: 400 }
      )
    }
    // Hard absolute max — reject anything above the paid ceiling before even checking tier
    if (wordCount > MAX_WORDS_PAID) {
      return NextResponse.json(
        { error: `文章超過 ${MAX_WORDS_PAID} 字的上限（目前 ${wordCount} 字）。` },
        { status: 400 }
      )
    }

    // Use admin client for reading/updating user data (bypasses RLS)
    const adminSupabase = createAdminClient()

    // Fetch user data to determine tier
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("uses_remaining, tier, words_remaining")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: "無法取得使用者資料。" },
        { status: 500 }
      )
    }

    const tier = userData.tier || "free_trial"

    // Tier-aware word limit check: free=1000 words, paid=2500 words
    const wordLimit = tier === "paid" ? MAX_WORDS_PAID : MAX_WORDS
    if (wordCount > wordLimit) {
      return NextResponse.json(
        {
          error: `文章超過 ${wordLimit} 字的限制（目前 ${wordCount} 字）。`,
          ...(tier !== "paid" && { upgradeRequired: true }),
        },
        { status: 400 }
      )
    }

    // Fetch user's saved custom prompt and notes (server-side only — never expose to client)
    const { data: styleData } = await adminSupabase
      .from("style_prompts")
      .select("custom_prompt, user_notes, style_language")
      .eq("user_id", user.id)
      .single()

    if (!styleData) {
      return NextResponse.json(
        { error: "尚未設定個人寫作風格，請先前往風格設定頁面進行分析。" },
        { status: 400 }
      )
    }

    // Quick pre-check to surface a clear error before attempting deduction
    // (The RPC is the real atomic gate — this just gives a better UX message)
    if (tier === "paid" && (userData.words_remaining || 0) < wordCount) {
      return NextResponse.json(
        { error: "本月字數已用盡，請等待下次續費後自動重置。" },
        { status: 403 }
      )
    }
    if (tier !== "paid" && userData.uses_remaining <= 0) {
      return NextResponse.json(
        { error: "免費試用次數已用完。請升級以繼續使用。", upgradeRequired: true },
        { status: 403 }
      )
    }

    // Atomically deduct usage BEFORE calling Gemini — prevents race condition
    // where concurrent requests all pass the check and all call Gemini
    const { data: deducted, error: deductError } = await adminSupabase.rpc(
      "deduct_usage",
      { p_user_id: user.id, p_words: wordCount, p_tier: tier }
    )

    if (deductError) {
      console.error("[rewrite-clone] deduct_usage RPC error:", deductError.message)
      return NextResponse.json(
        { error: "無法扣除使用額度，請稍後再試。" },
        { status: 500 }
      )
    }

    if (!deducted) {
      // RPC returned false — quota was exhausted (lost the race)
      return NextResponse.json(
        tier === "paid"
          ? { error: "本月字數已用盡，請等待下次續費後自動重置。" }
          : { error: "免費試用次數已用完。請升級以繼續使用。", upgradeRequired: true },
        { status: 403 }
      )
    }

    // Usage deducted — now safe to call Gemini
    // Pass systemPrompt and userContent separately to prevent prompt injection
    const notesAddendum = styleData.user_notes?.trim()
      ? lang === "chinese"
        ? `\n\n額外要求：${styleData.user_notes.trim()}`
        : `\n\nAdditional user preferences: ${styleData.user_notes.trim()}`
      : ""
    const systemPrompt = lang === "chinese"
      ? `請根據以下寫作風格規則，將文章改寫成繁體中文。保持原文意思，只輸出改寫後的文章，不要加任何說明。\n\n${styleData.custom_prompt}${notesAddendum}`
      : `${styleData.custom_prompt}${notesAddendum}`
    const rawRewrite = await callGemini(systemPrompt, essay)
    const rewrittenEssay = cleanRewriteOutput(rawRewrite)

    // Log usage
    await adminSupabase.from("usage_logs").insert({
      user_id: user.id,
      words_used: wordCount,
      mode: lang === "chinese" ? "personal_clone_zh" : "personal_clone",
      input_text: essay,
      output_text: rewrittenEssay,
    })

    return NextResponse.json({ result: rewrittenEssay })
  } catch (error) {
    console.error("Rewrite clone error:", error)
    return NextResponse.json(
      { error: "改寫過程中發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
