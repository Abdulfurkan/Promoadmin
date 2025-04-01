import { NextResponse } from "next/server";

export async function GET() {
  // Create a response that redirects to the login page
  const response = NextResponse.redirect(new URL("/login", "http://localhost:3004"));
  
  // Clear all possible NextAuth cookies
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.csrf-token',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token'
  ];
  
  cookiesToClear.forEach(name => {
    response.cookies.set(name, "", {
      expires: new Date(0),
      path: "/"
    });
  });
  
  return response;
}
