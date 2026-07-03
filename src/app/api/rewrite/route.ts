import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { callGemini } from "@/lib/gemini"
import { REWRITE_PROMPTS, REWRITE_PROMPT_CHINESE } from "@/lib/prompts"
import { countWords, MAX_WORDS, MAX_WORDS_PAID } from "@/lib/word-count"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { cleanRewriteOutput } from "@/lib/gemini-cleanup"

export async function POST(request: Request) {
  try {
    // Rate limit: max 20 rewrites per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("rewrite", ip, 20, 60 * 60 * 1000)) {
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

    const { essay, promptId = "1", language = "english" } = await request.json()

    if (!essay || typeof essay !== "string" || essay.trim().length === 0) {
      return NextResponse.json(
        { error: "請輸入要改寫的文章。" },
        { status: 400 }
      )
    }

    // Validate language
    if (language !== "english" && language !== "chinese") {
      return NextResponse.json(
        { error: "無效的語言選擇。" },
        { status: 400 }
      )
    }

    // Select prompt based on language
    const selectedPrompt = language === "chinese"
      ? REWRITE_PROMPT_CHINESE
      : REWRITE_PROMPTS[String(promptId)]
    if (!selectedPrompt) {
      return NextResponse.json(
        { error: "無效的改寫風格。" },
        { status: 400 }
      )
    }

    const wordCount = countWords(essay, language as 'english' | 'chinese')
    if (wordCount < 50) {
      return NextResponse.json(
        { error: "文章太短，請貼上至少 50 字的文章再試。" },
        { status: 400 }
      )
    }
    // Hard absolute max — reject anything above the paid ceiling before even checking tier
    if (wordCount > MAX_WORDS_PAID) {
      return NextResponse.json(
        { error: `文章超過 ${MAX_WORDS_PAID} 字上限（目前 ${wordCount} 字）。` },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Fetch user data to determine tier
    let { data: userData } = await adminSupabase
      .from("users")
      .select("uses_remaining, tier, words_remaining")
      .eq("id", user.id)
      .single()

    if (!userData) {
      // Row missing — auto-create with default free trial values
      await adminSupabase
        .from("users")
        .upsert(
          { id: user.id, email: user.email, uses_remaining: 3, tier: "free_trial", words_remaining: 0 },
          { onConflict: "id", ignoreDuplicates: true }
        )

      const { data: retryData } = await adminSupabase
        .from("users")
        .select("uses_remaining, tier, words_remaining")
        .eq("id", user.id)
        .single()

      if (!retryData) {
        return NextResponse.json(
          { error: "無法取得使用者資料。" },
          { status: 500 }
        )
      }
      userData = retryData
    }

    const tier = userData.tier || "free_trial"

    // Tier-aware word limit check: free=1000 words, paid=2500 words
    const wordLimit = tier === "paid" ? MAX_WORDS_PAID : MAX_WORDS
    if (wordCount > wordLimit) {
      return NextResponse.json(
        {
          error: `文章超過 ${wordLimit} 字上限（目前 ${wordCount} 字）。`,
          ...(tier !== "paid" && { upgradeRequired: true }),
        },
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
      console.error("[rewrite] deduct_usage RPC error:", deductError.message)
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
    const rawRewrite = await callGemini(selectedPrompt, essay)
    const rewrittenEssay = cleanRewriteOutput(rawRewrite)

    // Log usage
    await adminSupabase.from("usage_logs").insert({
      user_id: user.id,
      words_used: wordCount,
      mode: language === "chinese" ? "default_chinese" : "default_style",
      input_text: essay,
      output_text: rewrittenEssay,
    })

    return NextResponse.json({ result: rewrittenEssay })
  } catch (error) {
    console.error("Rewrite error:", error)
    return NextResponse.json(
      { error: "改寫過程中發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
