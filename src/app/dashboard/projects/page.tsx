import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type ProjectItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: { name: string };
};

export default async function ProjectsAdminPage() {
  const result = await backendFetch<ProjectItem[]>('/api/admin/v1/projects?pageSize=50');
  const items = result.data || [];

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>Projects</h1>
          <p className='text-sm text-muted-foreground'>Our Work / case studies.</p>
        </div>
        <Link
          href='/dashboard/projects/new'
          className='rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB]'
        >
          New project
        </Link>
      </div>

      <div className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>Title</th>
              <th className='px-4 py-3 font-medium'>Category</th>
              <th className='px-4 py-3 font-medium'>Status</th>
              <th className='px-4 py-3 font-medium' />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className='border-t border-border'>
                <td className='px-4 py-3 text-foreground'>{item.title}</td>
                <td className='px-4 py-3 text-foreground'>{item.category?.name}</td>
                <td className='px-4 py-3 uppercase text-foreground'>{item.status}</td>
                <td className='px-4 py-3 text-right'>
                  <Link
                    className='text-[#22AAFF] hover:underline'
                    href={`/dashboard/projects/${item.id}`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className='px-4 py-8 text-center text-muted-foreground' colSpan={4}>
                  Chưa có project.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
