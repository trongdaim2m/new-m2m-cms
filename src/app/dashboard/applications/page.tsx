import { ApplicationStatusSelect } from '@/features/cms/application-status-select';
import { backendFetch } from '@/lib/backend';

type ApplicationItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  jobPost: { id: string; slug: string; title: string };
  resumeMedia: { id: string; url: string; filename: string } | null;
};

export default async function ApplicationsAdminPage() {
  const result = await backendFetch<ApplicationItem[]>(
    '/api/admin/v1/job-applications?pageSize=50'
  );
  const items = result.data || [];

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Applications</h1>
        <p className='text-sm text-muted-foreground'>Hồ sơ ứng tuyển từ trang Careers.</p>
      </div>

      <div className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>Candidate</th>
              <th className='px-4 py-3 font-medium'>Job</th>
              <th className='px-4 py-3 font-medium'>Resume</th>
              <th className='px-4 py-3 font-medium'>Status</th>
              <th className='px-4 py-3 font-medium'>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className='border-t border-border align-top'>
                <td className='px-4 py-3'>
                  <div className='font-medium text-foreground'>{item.name}</div>
                  <div className='text-muted-foreground'>{item.email}</div>
                  <div className='text-muted-foreground'>{item.phone}</div>
                  <p className='mt-2 line-clamp-3 text-muted-foreground'>{item.coverLetter}</p>
                </td>
                <td className='px-4 py-3 text-foreground'>{item.jobPost?.title}</td>
                <td className='px-4 py-3'>
                  {item.resumeMedia ? (
                    <a
                      href={item.resumeMedia.url}
                      target='_blank'
                      rel='noreferrer'
                      className='text-[#22AAFF] hover:underline'
                    >
                      {item.resumeMedia.filename || 'Download'}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className='px-4 py-3'>
                  <ApplicationStatusSelect application={item} />
                </td>
                <td className='px-4 py-3 text-foreground'>
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className='px-4 py-8 text-center text-muted-foreground' colSpan={5}>
                  Chưa có ứng tuyển.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
