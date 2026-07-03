import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: 10 verifications per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("verify-payment", ip, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "請求次數過多，請稍後再試。" }, { status: 429 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 })
    }

    // Verify the user is logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify the Stripe session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Make sure this session belongs to this user
    const sessionUserId = session.metadata?.supabase_user_id
    if (sessionUserId !== user.id) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 })
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as { id: string })?.id

    // Update user to paid
    const adminSupabase = createAdminClient()

    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("monthly_quota")
      .eq("id", user.id)
      .single()

    const quota = existingUser?.monthly_quota ?? 20000

    const { error } = await adminSupabase
      .from("users")
      .update({
        tier: "paid",
        words_remaining: quota,
        billing_cycle_start: new Date().toISOString().split("T")[0],
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
      })
      .eq("id", user.id)

    if (error) {
      console.error("verify-payment: Supabase update error:", error)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    console.log(`verify-payment: ✅ User ${user.id} upgraded to paid`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("verify-payment error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
