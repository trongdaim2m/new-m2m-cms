import { notFound } from 'next/navigation';

import { getPageConfig } from '@/features/cms/pages/page-config';
import { PageSectionEditor } from '@/features/cms/pages/page-section-editor';

type Props = { params: Promise<{ page: string; key: string }> };

export default async function EditPageSectionPage({ params }: Props) {
  const { page, key } = await params;
  if (!getPageConfig(page)) notFound();
  return <PageSectionEditor key={`${page}/${key}`} page={page} sectionKey={key} />;
}
