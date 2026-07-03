import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: 10 portal sessions per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("create-portal", ip, 10, 60 * 60 * 1000)) {
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

    const adminSupabase = createAdminClient()

    const { data: userData } = await adminSupabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: "找不到訂閱資料。" },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Create portal session error:", error)
    return NextResponse.json(
      { error: "無法開啟訂閱管理頁面，請稍後再試。" },
      { status: 500 }
    )
  }
}
