import { NextResponse } from 'next/server';
import { CMS_TOKEN_COOKIE, CMS_USER_COOKIE } from '@/lib/cms-auth';

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(CMS_TOKEN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(CMS_USER_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

export async function POST() {
  return clearAuthCookies(NextResponse.json({ success: true }));
}

/** Used when the backend rejects the stored token (expired, user removed...). */
export async function GET() {
  // Relative Location: request.url can report the bind address (0.0.0.0) instead of the public host.
  return clearAuthCookies(
    new NextResponse(null, { status: 307, headers: { Location: '/auth/cms-login' } })
  );
}
