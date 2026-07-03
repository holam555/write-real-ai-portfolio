import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { callGemini } from "@/lib/gemini"
import { STYLE_ANALYSIS_PROMPT, STYLE_ANALYSIS_PROMPT_CHINESE, STYLE_SUMMARY_PROMPT } from "@/lib/prompts"
import { countWords, MAX_WORDS } from "@/lib/word-count"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { cleanStyleAnalysisOutput } from "@/lib/gemini-cleanup"

export async function POST(request: Request) {
  try {
    // Rate limit: max 10 style analyses per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("analyze-style", ip, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "請求次數過多，請稍後再試。" },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

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
        { error: "請輸入範文進行風格分析。" },
        { status: 400 }
      )
    }

    const wordCount = countWords(essay, lang)
    if (wordCount > MAX_WORDS) {
      return NextResponse.json(
        { error: `文章超過 ${MAX_WORDS} 字的限制（目前 ${wordCount} 字）。` },
        { status: 400 }
      )
    }

    // Fetch user tier and billing info
    const { data: userData } = await adminSupabase
      .from("users")
      .select("tier, billing_cycle_start")
      .eq("id", user.id)
      .single()

    const tier = userData?.tier || "free_trial"

    // --- Limit checks BEFORE calling Gemini ---
    if (tier === "free_trial") {
      // Free users: max 2 style analyses total
      const { count } = await adminSupabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "style_analysis")

      if ((count ?? 0) >= 2) {
        return NextResponse.json(
          { error: "STYLE_LIMIT_REACHED", tier: "free" },
          { status: 403 }
        )
      }
    } else if (tier === "paid") {
      // Paid users: max 20 style analyses per billing cycle
      const billingStart = userData?.billing_cycle_start
      let query = adminSupabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "style_analysis")

      if (billingStart) {
        query = query.gte("timestamp", billingStart)
      }

      const { count } = await query

      if ((count ?? 0) >= 20) {
        return NextResponse.json(
          { error: "STYLE_LIMIT_REACHED", tier: "paid" },
          { status: 403 }
        )
      }
    }

    // Call Gemini for style analysis
    // Pass systemPrompt and essay separately to prevent prompt injection
    const analysisPrompt = lang === "chinese" ? STYLE_ANALYSIS_PROMPT_CHINESE : STYLE_ANALYSIS_PROMPT
    const rawCustomPrompt = await callGemini(analysisPrompt, essay)
    const customPrompt = cleanStyleAnalysisOutput(rawCustomPrompt)

    // Generate style summary — no user content here, purely internal processing
    const summaryPrompt = `${STYLE_SUMMARY_PROMPT}${customPrompt}`
    const rawSummary = await callGemini(summaryPrompt)
    const styleSummary = cleanStyleAnalysisOutput(rawSummary)

    // Upsert style prompt for this user
    const { data: existing } = await adminSupabase
      .from("style_prompts")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existing) {
      await adminSupabase
        .from("style_prompts")
        .update({
          custom_prompt: customPrompt,
          style_summary: styleSummary,
          style_language: lang,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
    } else {
      await adminSupabase.from("style_prompts").insert({
        user_id: user.id,
        custom_prompt: customPrompt,
        style_summary: styleSummary,
        style_language: lang,
      })
    }

    // Log style analysis — if this fails silently it breaks the usage counter
    const { error: logError } = await adminSupabase.from("usage_logs").insert({
      user_id: user.id,
      words_used: wordCount,
      mode: "style_analysis",
      input_text: essay,
      output_text: customPrompt,
    })
    if (logError) {
      console.error("[analyze-style] usage_logs insert failed:", logError.message)
      // Return 500 so the frontend shows an error instead of silently mis-counting
      return NextResponse.json(
        { error: `使用記錄儲存失敗：${logError.message}。請聯絡管理員。` },
        { status: 500 }
      )
    }

    // Calculate remaining count
    let usedCount = 0
    if (tier === "paid" && userData?.billing_cycle_start) {
      const { count } = await adminSupabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "style_analysis")
        .gte("timestamp", userData.billing_cycle_start)
      usedCount = count ?? 0
    } else {
      const { count } = await adminSupabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "style_analysis")
      usedCount = count ?? 0
    }

    const maxCount = tier === "paid" ? 20 : 2
    const remainingCount = Math.max(0, maxCount - usedCount)

    // Return success — NEVER expose custom_prompt to frontend
    return NextResponse.json({
      message: "風格分析完成！",
      style_summary: styleSummary,
      used_count: usedCount,
      max_count: maxCount,
      remaining_count: remainingCount,
    })
  } catch (error) {
    console.error("Style analysis error:", error)
    return NextResponse.json(
      { error: "風格分析過程中發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
