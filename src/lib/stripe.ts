import Stripe from "stripe"

// Server-side only — lazy init to avoid build-time errors when env is empty
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripeInstance = new Stripe(key)
  }
  return stripeInstance
}
