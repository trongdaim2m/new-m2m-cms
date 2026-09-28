import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  category: { name: string };
};

export default async function NewsAdminPage() {
  const result = await backendFetch<NewsItem[]>('/api/admin/v1/news?pageSize=50');
  const items = result.data || [];

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>News</h1>
          <p className='text-sm text-muted-foreground'>Quản lý bài viết động từ editor/CMS.</p>
        </div>
        <Link
          href='/dashboard/news/new'
          className='rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB]'
        >
          New article
        </Link>
      </div>

      <div className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>Title</th>
              <th className='px-4 py-3 font-medium'>Category</th>
              <th className='px-4 py-3 font-medium'>Status</th>
              <th className='px-4 py-3 font-medium'>Published</th>
              <th className='px-4 py-3 font-medium' />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className='border-t border-border'>
                <td className='px-4 py-3 text-foreground'>{item.title}</td>
                <td className='px-4 py-3 text-foreground'>{item.category?.name}</td>
                <td className='px-4 py-3 uppercase text-foreground'>{item.status}</td>
                <td className='px-4 py-3 text-foreground'>
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}
                </td>
                <td className='px-4 py-3 text-right'>
                  <Link
                    className='text-[#22AAFF] hover:underline'
                    href={`/dashboard/news/${item.id}`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className='px-4 py-8 text-center text-muted-foreground' colSpan={5}>
                  Chưa có bài viết.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
