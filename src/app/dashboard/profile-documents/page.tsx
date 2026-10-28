import { ProfileDocumentsManager } from '@/features/cms/profile-documents-manager';

export default function ProfileDocumentsPage() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Profile PDFs</h1>
        <p className='text-sm text-muted-foreground'>
          Quản lý file PDF tải xuống từ footer và trang Projects (lịch sử dự án / hồ sơ năng lực).
        </p>
      </div>
      <ProfileDocumentsManager />
    </div>
  );
}
