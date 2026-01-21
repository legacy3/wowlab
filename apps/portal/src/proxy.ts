import { intlayerMiddleware } from "next-intlayer/middleware";
import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const response = intlayerMiddleware(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: "/((?!api|go|trpc|_next|_vercel|.*\\..*).*)",
};
