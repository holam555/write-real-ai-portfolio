import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: 5 checkout sessions per IP per hour — Stripe session creation is expensive
    const ip = getClientIp(request)
    if (!checkRateLimit("create-checkout", ip, 5, 60 * 60 * 1000)) {
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

    const stripe = getStripe()
    const adminSupabase = createAdminClient()

    // Check if user already has a stripe_customer_id
    const { data: userData } = await adminSupabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    let customerId = userData?.stripe_customer_id

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Save customer ID
      await adminSupabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured." },
        { status: 500 }
      )
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      request.headers.get("x-forwarded-proto") && request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
        : "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing`,
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Create checkout session error:", error)
    return NextResponse.json(
      { error: "無法建立付款頁面，請稍後再試。" },
      { status: 500 }
    )
  }
}
