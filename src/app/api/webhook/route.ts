import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import Stripe from "stripe"

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set")
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      )
    }

    const stripe = getStripe()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    console.log(`[Webhook] Handling event: ${event.type}`)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        console.log(`[Webhook] checkout.session.completed — userId: ${userId}, customer: ${session.customer}`)

        if (!userId) {
          console.error("[Webhook] ERROR: No supabase_user_id in session metadata", session.metadata)
          break
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

        console.log(`[Webhook] Updating user ${userId} to paid, subscriptionId: ${subscriptionId}`)

        const { data: existingUser } = await supabase
          .from("users")
          .select("monthly_quota")
          .eq("id", userId)
          .single()

        const quota = existingUser?.monthly_quota ?? 20000

        const { error } = await supabase
          .from("users")
          .update({
            tier: "paid",
            words_remaining: quota,
            billing_cycle_start: new Date().toISOString().split("T")[0],
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", userId)

        if (error) {
          console.error("[Webhook] Supabase update error:", error)
        } else {
          console.log(`[Webhook] ✅ User ${userId} upgraded to paid`)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id

        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (userData) {
          await supabase
            .from("users")
            .update({
              tier: "free_trial",
              words_remaining: 0,
              stripe_subscription_id: null,
            })
            .eq("id", userData.id)

          console.log(`User ${userData.id} subscription cancelled`)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id

        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (userData) {
          await supabase
            .from("users")
            .update({
              tier: "free_trial",
              words_remaining: 0,
            })
            .eq("id", userData.id)

          console.log(`User ${userData.id} payment failed`)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        // Skip the initial payment (handled by checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") {
          break
        }

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id

        const { data: userData } = await supabase
          .from("users")
          .select("id, monthly_quota")
          .eq("stripe_customer_id", customerId)
          .single()

        if (userData) {
          const quota = userData.monthly_quota ?? 20000
          await supabase
            .from("users")
            .update({
              tier: "paid",
              words_remaining: quota,
              billing_cycle_start: new Date().toISOString().split("T")[0],
            })
            .eq("id", userData.id)

          console.log(`User ${userData.id} subscription renewed`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
