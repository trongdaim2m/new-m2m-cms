import { NewsEditorForm } from '@/features/cms/news-editor-form';

type Props = { params: Promise<{ id: string }> };

export default async function EditNewsPage({ params }: Props) {
  const { id } = await params;
  return <NewsEditorForm articleId={id} />;
}
