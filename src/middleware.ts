import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  if (request.headers.get("host")?.startsWith("www.")) {
    // request.nextUrl is the internal URL (http://localhost:3000/...) behind a
    // reverse proxy, so we must NOT clone it for the redirect destination.
    // Always redirect to the canonical public origin.
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://writerealai.com").replace("://www.", "://")
    const destination = `${appUrl}${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(destination, 301)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
