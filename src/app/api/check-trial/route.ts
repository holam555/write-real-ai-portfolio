import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Rate limit: 30 checks per IP per hour — public endpoint, no auth required
    const ip = getClientIp(request)
    if (!checkRateLimit("check-trial", ip, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ available: false, count: 0 }, { status: 429 })
    }

    const supabase = createAdminClient()

    // Use actual users table count as source of truth — never go out of sync
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    const total = count ?? 0
    const available = total < 100

    return NextResponse.json({ available, count: total })
  } catch (error) {
    console.error("Check trial error:", error)
    return NextResponse.json({ available: true, count: 0 })
  }
}
