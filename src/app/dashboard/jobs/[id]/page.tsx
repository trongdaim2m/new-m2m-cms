import { JobEditorForm } from '@/features/cms/job-editor-form';

type Props = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: Props) {
  const { id } = await params;
  return <JobEditorForm jobId={id} />;
}
