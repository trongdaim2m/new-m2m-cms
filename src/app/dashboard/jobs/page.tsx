import Link from 'next/link';
import { backendFetch } from '@/lib/backend';

type JobItem = {
  id: string;
  slug: string;
  title: string;
  level: string;
  location: string;
  status: string;
};

export default async function JobsAdminPage() {
  const result = await backendFetch<JobItem[]>('/api/admin/v1/jobs?pageSize=50');
  const items = result.data || [];

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>Careers</h1>
          <p className='text-sm text-muted-foreground'>Open positions.</p>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href='/dashboard/jobs/activities'
            className='rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted'
          >
            SOME ACTIVITES
          </Link>
          <Link
            href='/dashboard/jobs/new'
            className='rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB]'
          >
            New job
          </Link>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>Title</th>
              <th className='px-4 py-3 font-medium'>Level</th>
              <th className='px-4 py-3 font-medium'>Location</th>
              <th className='px-4 py-3 font-medium'>Status</th>
              <th className='px-4 py-3 font-medium' />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className='border-t border-border'>
                <td className='px-4 py-3 text-foreground'>{item.title}</td>
                <td className='px-4 py-3 text-foreground'>{item.level}</td>
                <td className='px-4 py-3 text-foreground'>{item.location}</td>
                <td className='px-4 py-3 uppercase text-foreground'>{item.status}</td>
                <td className='px-4 py-3 text-right'>
                  <Link
                    className='text-[#22AAFF] hover:underline'
                    href={`/dashboard/jobs/${item.id}`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className='px-4 py-8 text-center text-muted-foreground' colSpan={5}>
                  Chưa có job.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
