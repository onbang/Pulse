import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  const skewProtectionEnabled =
    process.env.VERCEL_SKEW_PROTECTION_ENABLED === "1";

  if (skewProtectionEnabled && deploymentId && !request.cookies.get("__vdpl")) {
    response.cookies.set("__vdpl", deploymentId, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
