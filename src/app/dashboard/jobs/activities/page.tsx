import Link from 'next/link';

import { CareerActivitiesManager } from '@/features/cms/career-activities-manager';

export default function CareerActivitiesPage() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>SOME ACTIVITES</h1>
          <p className='text-sm text-muted-foreground'>Ảnh gallery trang Career / Recruitment.</p>
        </div>
        <Link href='/dashboard/jobs' className='text-sm text-[#22AAFF] hover:underline'>
          ← Jobs
        </Link>
      </div>
      <CareerActivitiesManager />
    </div>
  );
}
