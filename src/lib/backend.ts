import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CMS_TOKEN_COOKIE, getApiBaseUrl } from '@/lib/cms-auth';

type BackendEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: { page: number; pageSize: number; total: number };
  error?: { code: string; message: string };
};

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<BackendEnvelope<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_TOKEN_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store'
  });

  if (res.status === 401) {
    redirect('/api/cms/logout');
  }

  const json = (await res.json()) as BackendEnvelope<T>;
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message || `Backend error ${res.status}`);
  }
  return json;
}
