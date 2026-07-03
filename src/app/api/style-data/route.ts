import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Rate limit: 60 requests per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("style-data", ip, 60, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "請求次數過多，請稍後再試。" }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "請先登入。" }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Fetch user tier and billing info
    const { data: userData } = await adminSupabase
      .from("users")
      .select("tier, billing_cycle_start")
      .eq("id", user.id)
      .single()

    const tier = userData?.tier || "free_trial"

    // Fetch style_summary and user_notes (NEVER custom_prompt)
    const { data: styleData } = await adminSupabase
      .from("style_prompts")
      .select("style_summary, user_notes, updated_at, style_language")
      .eq("user_id", user.id)
      .single()

    // Count style analyses used
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

    return NextResponse.json({
      has_style: !!styleData?.style_summary,
      style_summary: styleData?.style_summary ?? null,
      user_notes: styleData?.user_notes ?? null,
      updated_at: styleData?.updated_at ?? null,
      style_language: styleData?.style_language ?? null,
      tier,
      used_count: usedCount,
      max_count: maxCount,
      remaining_count: Math.max(0, maxCount - usedCount),
    })
  } catch (error) {
    console.error("[style-data] error:", error)
    return NextResponse.json(
      { error: "發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
