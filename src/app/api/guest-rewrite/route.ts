import { NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini"
import { REWRITE_PROMPTS, REWRITE_PROMPT_CHINESE } from "@/lib/prompts"
import { countWords, MAX_WORDS } from "@/lib/word-count"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { cleanRewriteOutput } from "@/lib/gemini-cleanup"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    // Rate limit: max 3 guest rewrites per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("guest-rewrite", ip, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "請求次數過多，請稍後再試。" },
        { status: 429 }
      )
    }

    const { essay, language = "english" } = await request.json()

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

    const wordCount = countWords(essay, language as 'english' | 'chinese')
    if (wordCount < 50) {
      return NextResponse.json(
        { error: "文章太短，請貼上至少 50 字的文章再試。" },
        { status: 400 }
      )
    }
    if (wordCount > MAX_WORDS) {
      return NextResponse.json(
        { error: `文章超過 ${MAX_WORDS} 字上限（目前 ${wordCount} 字）。` },
        { status: 400 }
      )
    }

    // Select prompt based on language
    // Pass systemPrompt and userContent separately to prevent prompt injection
    const selectedPrompt = language === "chinese" ? REWRITE_PROMPT_CHINESE : REWRITE_PROMPTS["1"]
    const rawRewrite = await callGemini(selectedPrompt, essay)
    const rewrittenEssay = cleanRewriteOutput(rawRewrite)

    // Log usage (no user_id for guests)
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from("usage_logs").insert({
        user_id: null,
        words_used: wordCount,
        mode: language === "chinese" ? "guest_trial_chinese" : "guest_trial",
        input_text: essay,
        output_text: rewrittenEssay,
      })
    } catch {
      // Don't fail the request if logging fails
      console.error("Failed to log guest usage")
    }

    return NextResponse.json({ result: rewrittenEssay })
  } catch (error) {
    console.error("Guest rewrite error:", error)
    return NextResponse.json(
      { error: "改寫過程中發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
