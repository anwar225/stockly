import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow auth routes (must be first)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  // Protect API routes
  if (pathname.startsWith("/api") && !isAuthenticated) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    )
  }

  // Check if user is active (token-based verification)
  // This provides a lightweight check without DB query
  // Note: The JWT expires naturally, so the active state is valid during its lifetime
  if (isAuthenticated && (token.active as boolean) === false) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      )
    }
    // Redirect to login for web requests
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect to login if not authenticated and not on login page
  if (!isAuthenticated && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect to app if authenticated and on login page
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
