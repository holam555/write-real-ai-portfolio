import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Fail closed if Supabase env vars are missing
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return new NextResponse("Server configuration error", { status: 500 })
  }

  // Collect cookies directly from setAll so we can forward them on
  // redirects. supabaseResponse.cookies.getAll() can miss cookies when
  // getUser() validates without refreshing (setAll never fires).
  const sessionCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

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
            sessionCookies.push({ name, value, options: options as Record<string, unknown> })
          })
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const protectedPaths = ["/dashboard", "/settings", "/billing"]
  const authPaths = ["/login", "/signup"]
  const pathname = request.nextUrl.pathname

  // Skip session check for the auth callback — it handles its own auth.
  // Running getUser() here can destroy the PKCE code verifier cookie
  // (via _removeSession) before the callback route reads it.
  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse
  }

  // Log auth cookie names on request for debugging
  const authCookieNames = request.cookies.getAll()
    .map(c => c.name)
    .filter(n => n.startsWith("sb-"))
  console.log("[Middleware] Path:", pathname, "| Auth cookies on request:", authCookieNames.length > 0 ? authCookieNames.join(", ") : "NONE")

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  if (getUserError) {
    console.error("[Middleware] getUser error on", pathname, ":", getUserError.message)
  }

  // Build absolute redirect URL. Always use the canonical app URL to
  // prevent www vs non-www domain mismatches that break session cookies.
  // Cookies set on "writerealai.com" are NOT sent to "www.writerealai.com",
  // so we must always redirect to the exact same origin.
  // Strip www. in case NEXT_PUBLIC_APP_URL is set to the www variant in CI secrets.
  const CANONICAL_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://writerealai.com")
    .replace("://www.", "://")

  function makeRedirectUrl(dest: string): URL {
    return new URL(dest, CANONICAL_URL)
  }

  console.log("[Middleware] Path:", pathname, "| Has user:", !!user, "| Session cookies from setAll:", sessionCookies.length)

  // Helper: create a redirect that preserves the session cookies.
  // When getUser() refreshes a token, new cookies are set via setAll.
  // We must forward those onto the redirect response or the browser
  // keeps sending the old (now-invalidated) tokens → redirect loop.
  function redirectWithCookies(dest: string): NextResponse {
    const url = makeRedirectUrl(dest)
    console.log("[Middleware] Redirect to:", url.toString(), "| Forwarding", sessionCookies.length, "cookies")
    const res = NextResponse.redirect(url)
    sessionCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options)
    })
    return res
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && protectedPaths.some((path) => pathname.startsWith(path))) {
    console.log("[Middleware] No user at protected path — redirecting to /login")
    return redirectWithCookies("/login")
  }

  // Redirect authenticated users away from auth pages
  if (user && authPaths.some((path) => pathname.startsWith(path))) {
    console.log("[Middleware] Authenticated at auth page — redirecting to /dashboard")
    return redirectWithCookies("/dashboard")
  }

  return supabaseResponse
}
