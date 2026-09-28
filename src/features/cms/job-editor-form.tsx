'use client';

import { CmsRichTextEditor } from '@/features/cms/cms-rich-text-editor';
import { flushPendingMediaDeletes } from '@/features/cms/flush-pending-media';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type JobLevel = 'Junior' | 'Middle' | 'Senior';

type Props = {
  jobId?: string;
};

const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };

export function JobEditorForm({ jobId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<JobLevel>('Junior');
  const [location, setLocation] = useState('Hanoi');
  const [descriptionHtml, setDescriptionHtml] = useState('<p></p>');
  const [descriptionJson, setDescriptionJson] = useState<Record<string, unknown>>(emptyDoc);
  const [responsibilitiesHtml, setResponsibilitiesHtml] = useState('<p></p>');
  const [responsibilitiesJson, setResponsibilitiesJson] =
    useState<Record<string, unknown>>(emptyDoc);
  const [benefitsHtml, setBenefitsHtml] = useState('<p></p>');
  const [benefitsJson, setBenefitsJson] = useState<Record<string, unknown>>(emptyDoc);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingMediaDeletes = useRef<Set<string>>(new Set());

  const queueMediaDelete = (mediaId: string) => {
    pendingMediaDeletes.current.add(mediaId);
  };

  useEffect(() => {
    if (!jobId) return;
    void (async () => {
      const res = await fetch(`/api/cms/jobs/${jobId}`);
      const json = await res.json();
      const job = json.data;
      if (job) {
        setTitle(job.title || '');
        setLevel((job.level as JobLevel) || 'Junior');
        setLocation(job.location || 'Hanoi');
        setDescriptionHtml(job.descriptionHtml || '<p></p>');
        if (job.descriptionJson) setDescriptionJson(job.descriptionJson);
        setResponsibilitiesHtml(job.responsibilitiesHtml || '<p></p>');
        if (job.responsibilitiesJson) {
          setResponsibilitiesJson(job.responsibilitiesJson);
        }
        setBenefitsHtml(job.benefitsHtml || '<p></p>');
        if (job.benefitsJson) setBenefitsJson(job.benefitsJson);
        setStatus(job.status === 'published' ? 'published' : 'draft');
      }
    })();
  }, [jobId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const toastId = toast.loading(jobId ? 'Đang cập nhật job…' : 'Đang tạo job…');
    try {
      const payload = {
        title,
        level,
        location,
        descriptionHtml,
        descriptionJson,
        responsibilitiesHtml,
        responsibilitiesJson,
        benefitsHtml,
        benefitsJson,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : null
      };

      const res = await fetch(jobId ? `/api/cms/jobs/${jobId}` : '/api/cms/jobs', {
        method: jobId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || json?.message || 'Save failed');
      }
      await flushPendingMediaDeletes(pendingMediaDeletes.current, [
        descriptionHtml,
        responsibilitiesHtml,
        benefitsHtml
      ]);
      pendingMediaDeletes.current.clear();
      toast.success(jobId ? 'Đã cập nhật job' : 'Đã tạo job', { id: toastId });
      router.push('/dashboard/jobs');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='mx-auto flex w-full max-w-3xl flex-col gap-4 p-6'>
      <h1 className='text-2xl font-semibold'>{jobId ? 'Edit job' : 'New job'}</h1>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Title</span>
        <input
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='space-y-1 text-sm'>
          <span className='font-medium'>Level</span>
          <select
            className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
            value={level}
            onChange={(e) => setLevel(e.target.value as JobLevel)}
          >
            <option value='Junior'>Junior</option>
            <option value='Middle'>Middle</option>
            <option value='Senior'>Senior</option>
          </select>
        </label>
        <label className='space-y-1 text-sm'>
          <span className='font-medium'>Location</span>
          <input
            className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </label>
      </div>
      <div className='space-y-1 text-sm'>
        <span className='font-medium'>Description</span>
        <CmsRichTextEditor
          value={descriptionHtml}
          valueJson={descriptionJson}
          variant='career'
          minHeightClassName='min-h-[160px]'
          onChange={(html, json) => {
            setDescriptionHtml(html);
            setDescriptionJson(json);
          }}
          onMediaRemoved={queueMediaDelete}
        />
      </div>
      <div className='space-y-1 text-sm'>
        <span className='font-medium'>Responsibilities</span>
        <CmsRichTextEditor
          value={responsibilitiesHtml}
          valueJson={responsibilitiesJson}
          variant='career'
          minHeightClassName='min-h-[160px]'
          placeholder='Bullet list trách nhiệm…'
          onChange={(html, json) => {
            setResponsibilitiesHtml(html);
            setResponsibilitiesJson(json);
          }}
          onMediaRemoved={queueMediaDelete}
        />
      </div>
      <div className='space-y-1 text-sm'>
        <span className='font-medium'>Benefits</span>
        <CmsRichTextEditor
          value={benefitsHtml}
          valueJson={benefitsJson}
          variant='career'
          minHeightClassName='min-h-[160px]'
          placeholder='Bullet list quyền lợi…'
          onChange={(html, json) => {
            setBenefitsHtml(html);
            setBenefitsJson(json);
          }}
          onMediaRemoved={queueMediaDelete}
        />
      </div>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Status</span>
        <select
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
        >
          <option value='draft'>draft</option>
          <option value='published'>published</option>
        </select>
      </label>
      {error ? <p className='text-sm text-red-600'>{error}</p> : null}
      <button
        type='submit'
        disabled={loading}
        className='inline-flex items-center justify-center gap-2 rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB] disabled:opacity-60'
      >
        {loading ? <Spinner className='size-4 text-white' /> : null}
        {loading ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
