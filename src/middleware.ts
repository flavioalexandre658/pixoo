import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// NOTE: This middleware is purely for i18n routing.
// Authentication and authorization checks are performed in the application layout (`src/app/[locale]/(application)/layout.tsx`).
export default async function middleware(req: NextRequest) {
  const response = intlMiddleware(req);

  const locale = req.nextUrl.pathname.split("/")[1] || "pt";
  response.headers.set("x-locale", locale);
  response.headers.set("x-pathname", req.nextUrl.pathname);

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

export const runtime = "nodejs";
