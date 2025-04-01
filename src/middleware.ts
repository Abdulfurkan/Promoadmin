import { NextResponse } from 'next/server';
import { auth } from './auth';
 
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');
  const isValidateTokenRoute = req.nextUrl.pathname.startsWith('/api/validate-token');
  const isPublicApiRoute = req.nextUrl.pathname.startsWith('/api/public');

  // Allow access to auth API routes
  if (isAuthRoute) {
    return NextResponse.next();
  }
  
  // Allow access to login page
  if (isLoginPage) {
    // If already logged in, redirect to dashboard
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
    return NextResponse.next();
  }
  
  // Allow access to validate-token endpoint without authentication
  if (isValidateTokenRoute) {
    return NextResponse.next();
  }
  
  // Allow access to public API routes without authentication
  if (isPublicApiRoute) {
    return NextResponse.next();
  }
  
  // Protect API routes except auth routes
  if (isApiRoute && !isLoggedIn) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
  
  // Protect all other routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }
  
  return NextResponse.next();
})

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
