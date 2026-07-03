import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isDisposableEmail } from "@/lib/disposable-emails"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: max 5 signup attempts per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("signup", ip, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "註冊嘗試次數過多，請稍後再試。" },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()
    // Always use a hardcoded server-side redirect URL — never trust client-provided redirectTo
    // This prevents open redirect attacks where an attacker sets redirectTo to a malicious URL
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "請輸入有效的電子郵件。" },
        { status: 400 }
      )
    }

    // Server-side disposable email check (cannot be bypassed)
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "不支援使用拋棄式電子郵件註冊。" },
        { status: 400 }
      )
    }

    // Check if free trial slots are available — use actual DB count as source of truth
    const adminSupabase = createAdminClient()
    const { count: userCount } = await adminSupabase
      .from("users")
      .select("*", { count: "exact", head: true })

    console.log(`[Signup] Current user count: ${userCount ?? 0} / 100`)

    if ((userCount ?? 0) >= 100) {
      console.log(`[Signup] Trial full — rejecting signup for ${email}`)
      return NextResponse.json(
        { error: "TRIAL_FULL" },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    if (password) {
      // Password signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) {
        console.error("[signup] password signup error:", error.message)
        if (error.message.includes("already registered") || error.status === 422) {
          return NextResponse.json({ error: "EMAIL_ALREADY_REGISTERED" }, { status: 400 })
        }
        return NextResponse.json(
          { error: "發生錯誤，請稍後再試。" },
          { status: 400 }
        )
      }
    } else {
      // Magic link signup
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      })
      if (error) {
        // Log the real error server-side but never expose it to the client
        console.error("[signup] magic link error:", error.message)
        return NextResponse.json(
          { error: "發生錯誤，請稍後再試。" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
