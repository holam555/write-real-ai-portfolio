import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Rate limit: 60 requests per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("user-data", ip, 60, 60 * 60 * 1000)) {
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

    const { data: userData, error } = await adminSupabase
      .from("users")
      .select("uses_remaining, tier, words_remaining, monthly_quota, billing_cycle_start")
      .eq("id", user.id)
      .single()

    if (error || !userData) {
      console.error("[user-data] fetch error:", error)
      return NextResponse.json({ error: "無法取得使用者資料。" }, { status: 500 })
    }

    return NextResponse.json({
      uses_remaining: userData.uses_remaining ?? 0,
      tier: userData.tier || "free_trial",
      words_remaining: userData.words_remaining ?? 0,
      monthly_quota: userData.monthly_quota ?? 20000,
      billing_cycle_start: userData.billing_cycle_start ?? null,
    })
  } catch (error) {
    console.error("[user-data] unexpected error:", error)
    return NextResponse.json({ error: "發生錯誤，請稍後再試。" }, { status: 500 })
  }
}
