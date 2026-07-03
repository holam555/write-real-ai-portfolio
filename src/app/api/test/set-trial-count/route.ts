import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// ⚠️ DEV ONLY — this endpoint is disabled in production
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const url = new URL(request.url)
  const value = parseInt(url.searchParams.get("value") ?? "3", 10)

  if (isNaN(value) || value < 0) {
    return NextResponse.json({ error: "Invalid value. Use ?value=3" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const adminSupabase = createAdminClient()

  // Also fetch current global user count for context
  const { count: globalCount } = await adminSupabase
    .from("users")
    .select("*", { count: "exact", head: true })

  const { error } = await adminSupabase
    .from("users")
    .update({ uses_remaining: value })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[TEST] Set uses_remaining=${value} for user ${user.email}`)

  return NextResponse.json({
    ok: true,
    user: user.email,
    uses_remaining: value,
    global_user_count: globalCount ?? 0,
    trial_slots_full: (globalCount ?? 0) >= 100,
    note: "This endpoint only works in development (NODE_ENV !== production)",
  })
}
