import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Rate limit: 20 saves per IP per hour
    const ip = getClientIp(request)
    if (!checkRateLimit("style-notes", ip, 20, 60 * 60 * 1000)) {
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

    // Check user is paid
    const { data: userData } = await adminSupabase
      .from("users")
      .select("tier")
      .eq("id", user.id)
      .single()

    if (userData?.tier !== "paid") {
      return NextResponse.json(
        { error: "此功能僅限付費用戶使用。" },
        { status: 403 }
      )
    }

    const { notes } = await request.json()

    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: "無效的備註內容。" },
        { status: 400 }
      )
    }

    // Update user_notes in style_prompts
    const { error } = await adminSupabase
      .from("style_prompts")
      .update({ user_notes: notes || null })
      .eq("user_id", user.id)

    if (error) {
      console.error("[style-notes] update error:", error)
      return NextResponse.json(
        { error: "儲存備註時發生錯誤。" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[style-notes] error:", error)
    return NextResponse.json(
      { error: "發生錯誤，請稍後再試。" },
      { status: 500 }
    )
  }
}
