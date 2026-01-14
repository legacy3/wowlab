import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
