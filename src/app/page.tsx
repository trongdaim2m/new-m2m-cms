import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CMS_TOKEN_COOKIE } from '@/lib/cms-auth';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/auth/cms-login');
  }
  redirect('/dashboard/news');
}
