import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Server-side sign-out: clears session cookies in the response headers.
// Client-side signOut() cannot reliably delete chunked cookies (sb-xxx.0,
// sb-xxx.1) because it doesn't know the exact attributes used when they
// were set server-side. Doing it here ensures the Set-Cookie headers
// clear everything correctly.
export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const CANONICAL_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://writerealai.com")
    .replace("://www.", "://")

  return NextResponse.redirect(`${CANONICAL_URL}/`, { status: 302 })
}
