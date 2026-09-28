import { ContactDeleteButton } from '@/features/cms/contact-delete-button';
import { ContactStatusSelect } from '@/features/cms/contact-status-select';
import { backendFetch } from '@/lib/backend';

type ContactItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};

export default async function ContactsAdminPage() {
  const result = await backendFetch<ContactItem[]>('/api/admin/v1/contact-inquiries?pageSize=100');
  const items = result.data || [];

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Contacts</h1>
        <p className='text-sm text-muted-foreground'>Tin nhắn từ form GET IN TOUCH (trang chủ).</p>
      </div>

      <div className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 font-medium'>Người gửi</th>
              <th className='px-4 py-3 font-medium'>Nội dung</th>
              <th className='px-4 py-3 font-medium'>Status</th>
              <th className='px-4 py-3 font-medium'>Thời gian</th>
              <th className='px-4 py-3 font-medium' />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className='border-t border-border align-top'>
                <td className='px-4 py-3'>
                  <div className='font-medium text-foreground'>{item.name}</div>
                  <a href={`mailto:${item.email}`} className='text-[#22AAFF] hover:underline'>
                    {item.email}
                  </a>
                </td>
                <td className='max-w-md px-4 py-3 whitespace-pre-wrap text-foreground'>
                  {item.message}
                </td>
                <td className='px-4 py-3'>
                  <ContactStatusSelect inquiry={item} />
                </td>
                <td className='px-4 py-3 text-foreground'>
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className='px-4 py-3 text-right'>
                  <ContactDeleteButton id={item.id} />
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className='px-4 py-8 text-center text-muted-foreground' colSpan={5}>
                  Chưa có liên hệ.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
