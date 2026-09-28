import { notFound } from 'next/navigation';

import { getPageConfig } from '@/features/cms/pages/page-config';
import { PageSectionsManager } from '@/features/cms/pages/page-sections-manager';

type Props = { params: Promise<{ page: string }> };

export default async function PageSectionsPage({ params }: Props) {
  const { page } = await params;
  const config = getPageConfig(page);
  if (!config) notFound();

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold text-foreground'>{config.title}</h1>
        <p className='text-sm text-muted-foreground'>{config.description}</p>
      </div>
      <PageSectionsManager key={page} page={page} />
    </div>
  );
}
