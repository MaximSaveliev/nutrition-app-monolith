import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // All authentication is handled by FastAPI backend
  // Just allow all requests to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
