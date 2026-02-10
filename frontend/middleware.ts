import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Middleware to protect routes - using JWT-based check for NextAuth v5
export async function middleware(request: NextRequest) {
  // Don't protect the auth pages themselves
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Get the session token using NextAuth's JWT utility
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If there's a valid token, user is authenticated
  const isAuthenticated = !!token;

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/profile',
    '/user',
    '/chat',
    '/health',
    // Add other protected routes here
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to sign-in page with callback URL
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = `callbackUrl=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configuration for which paths the middleware should run
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};