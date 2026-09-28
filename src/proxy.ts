import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** CMS uses JWT cookie auth (m2m_cms_token). Clerk middleware disabled. */
export default function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
