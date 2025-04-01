import { NextResponse } from "next/server";

export async function GET() {
  // Create a response that clears the auth cookie
  const response = NextResponse.redirect(new URL("/login", "http://localhost:3002"));
  
  // Clear the session cookie
  response.cookies.set("next-auth.session-token", "", { 
    expires: new Date(0),
    path: "/"
  });
  
  return response;
}
