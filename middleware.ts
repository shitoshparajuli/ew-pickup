import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  // Protected routes
  const protectedPaths = ["/profile"];
  const path = request.nextUrl.pathname;

  // Check if the path is a protected route
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );

  if (isProtectedPath) {
    // We'll do a client-side redirect in the component
    // This middleware mainly initializes the auth session cookie parsing
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*"],
};