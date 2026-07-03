import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { EmailOtpType } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const PROD_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://writerealai.com").replace("://www.", "://")

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  // Validate next param: must be a relative path starting with / but not //
  // This prevents open redirect attacks like ?next=//evil.com
  const rawNext = searchParams.get("next") ?? "/dashboard"
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard"

  console.log("[Callback] Request URL:", request.url)
  console.log("[Callback] code:", code ? code.slice(0, 10) + "..." : "null", "| token_hash:", tokenHash ? "present" : "null", "| type:", type)

  if (!code && !tokenHash) {
    console.log("[Callback] No code or token_hash — redirecting to login")
    return NextResponse.redirect(`${PROD_URL}/login?error=no_code`)
  }

  // We must collect the cookies Supabase sets during auth exchange and
  // forward them onto the redirect response. Using createClient() from
  // the server util loses cookies because NextResponse.redirect() is a
  // fresh response object that doesn't carry them.
  const cookiesToForward: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToForward.push({ name, value, options: options as Record<string, unknown> })
          })
        },
      },
    }
  )

  let userId: string | undefined
  let userEmail: string | null | undefined

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.session) {
      console.error("[Callback] Exchange error:", error?.message)
      return NextResponse.redirect(`${PROD_URL}/login?error=auth_failed`)
    }
    console.log("[Callback] Session established for user:", data.session.user.id)
    userId = data.session.user.id
    userEmail = data.session.user.email
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error || !data.session) {
      console.error("[Callback] verifyOtp error:", error?.message)
      return NextResponse.redirect(`${PROD_URL}/login?error=auth_failed`)
    }
    console.log("[Callback] OTP verified for user:", data.session.user.id)
    userId = data.session.user.id
    userEmail = data.session.user.email
  }

  if (!userId) {
    return NextResponse.redirect(`${PROD_URL}/login?error=auth_failed`)
  }

  // Ensure public.users row exists
  try {
    const admin = createAdminClient()
    const { data: existing } = await admin.from("users").select("id").eq("id", userId).single()
    if (!existing) {
      await admin.from("users").insert({
        id: userId,
        email: userEmail ?? null,
        uses_remaining: 3,
        tier: "free_trial",
        words_remaining: 0,
      })
    }
  } catch (e) {
    console.error("[auth/callback] users row error:", e)
  }

  // Build redirect and attach all auth cookies so the browser receives
  // the session tokens and subsequent requests are authenticated.
  const redirectUrl = `${PROD_URL}${next}`
  console.log("[Callback] Redirecting to:", redirectUrl, "| Forwarding", cookiesToForward.length, "cookies:", cookiesToForward.map(c => c.name).join(", "))
  const res = NextResponse.redirect(redirectUrl)
  cookiesToForward.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options)
  })
  return res
}
