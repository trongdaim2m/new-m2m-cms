import { NextResponse } from 'next/server';
import { CMS_TOKEN_COOKIE, CMS_USER_COOKIE, getApiBaseUrl } from '@/lib/cms-auth';

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${getApiBaseUrl()}/api/admin/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    return NextResponse.json(
      { success: false, message: json?.error?.message || 'Login failed' },
      { status: 401 }
    );
  }

  const { accessToken, user } = json.data;
  const response = NextResponse.json({ success: true, data: { user } });
  response.cookies.set(CMS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  });
  response.cookies.set(CMS_USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
