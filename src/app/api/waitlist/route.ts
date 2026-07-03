import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isDisposableEmail } from "@/lib/disposable-emails"

export async function POST(request: Request) {
  try {
    // Rate limit: max 3 waitlist submissions per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("waitlist", ip, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "提交次數過多，請稍後再試。" },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "請輸入有效的電子郵件。" },
        { status: 400 }
      )
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "不支援使用拋棄式電子郵件。" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Check if email already on waitlist
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ status: "duplicate" })
    }

    // Insert into waitlist
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.toLowerCase().trim() })

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json({ status: "duplicate" })
      }
      throw error
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Waitlist error:", error)
    return NextResponse.json(
      { error: "發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
