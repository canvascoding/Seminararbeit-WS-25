import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  console.log("middleware routing config", routing);
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|assets|.*\\..*).*)"],
};
