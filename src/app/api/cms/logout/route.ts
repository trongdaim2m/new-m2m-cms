import { NextResponse } from 'next/server';
import { CMS_TOKEN_COOKIE, CMS_USER_COOKIE } from '@/lib/cms-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CMS_TOKEN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(CMS_USER_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
