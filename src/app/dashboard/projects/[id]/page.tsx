import { ProjectEditorForm } from '@/features/cms/project-editor-form';

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  return <ProjectEditorForm projectId={id} />;
}
