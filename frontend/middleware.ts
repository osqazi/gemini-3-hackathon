import { NextRequest, NextResponse } from 'next/server';

// Middleware to protect routes - using cookie-based check for NextAuth v5
export async function middleware(request: NextRequest) {
  // Don't protect the auth pages themselves
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie - NextAuth sets various cookies when authenticated
  const sessionToken = request.cookies.get('next-auth.session-token') ||
                      request.cookies.get('__Secure-next-auth.session-token');

  // If there's a session token, user is authenticated
  const hasSession = !!sessionToken;

  // Protected routes that require authentication (excluding /user and /profile routes to avoid redirect loops)
  // Let the individual pages handle authentication checks
  const protectedRoutes = [];

  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = `callbackUrl=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configuration for which paths the middleware should run
export const config = {
  matcher: [],
};