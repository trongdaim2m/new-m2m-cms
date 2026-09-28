'use client';

import { CmsRichTextEditor } from '@/features/cms/cms-rich-text-editor';
import { flushPendingMediaDeletes } from '@/features/cms/flush-pending-media';
import { MediaCoverPicker } from '@/features/cms/media-cover-picker';
import { MediaGalleryPicker } from '@/features/cms/media-gallery-picker';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Category = { id: string; name: string; slug: string };

type Props = {
  projectId?: string;
};

export function ProjectEditorForm({ projectId }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contentHtml, setContentHtml] = useState('<p></p>');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({
    type: 'doc',
    content: [{ type: 'paragraph' }]
  });
  const [coverMediaId, setCoverMediaId] = useState<string | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryIds, setGalleryIds] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingMediaDeletes = useRef<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      const catsRes = await fetch('/api/cms/projects/categories');
      const catsJson = await catsRes.json();
      const cats = (catsJson.data || []) as Category[];
      setCategories(cats);
      if (cats[0] && !categoryId) setCategoryId(cats[0].id);

      if (projectId) {
        const res = await fetch(`/api/cms/projects/${projectId}`);
        const json = await res.json();
        const project = json.data;
        if (project) {
          setTitle(project.title || '');
          setHeadline(project.headline || '');
          setExcerpt(project.excerpt || '');
          setCategoryId(project.categoryId || '');
          setContentHtml(project.contentHtml || '<p></p>');
          if (project.contentJson) setContentJson(project.contentJson);
          setCoverMediaId(project.coverMediaId || undefined);
          setCoverPreview(project.coverMedia?.url || null);
          const gallery = Array.isArray(project.gallery)
            ? (project.gallery.filter((x: unknown) => typeof x === 'string') as string[])
            : [];
          setGalleryIds(gallery);
          // Resolve preview URLs from media list if needed
          if (gallery.length > 0) {
            const mediaRes = await fetch('/api/cms/media?pageSize=100');
            const mediaJson = await mediaRes.json();
            const mediaItems = (mediaJson.data || []) as Array<{
              id: string;
              url: string;
            }>;
            const map = new Map(mediaItems.map((m) => [m.id, m.url]));
            setGalleryPreviews(gallery.map((id) => map.get(id) || '').filter(Boolean));
          }
          setStatus(project.status === 'published' ? 'published' : 'draft');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const toastId = toast.loading(projectId ? 'Đang cập nhật project…' : 'Đang tạo project…');
    try {
      const payload = {
        title,
        headline,
        excerpt,
        categoryId,
        contentHtml,
        contentJson,
        galleryMediaIds: galleryIds,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
        coverMediaId: coverMediaId ?? null
      };

      const res = await fetch(projectId ? `/api/cms/projects/${projectId}` : '/api/cms/projects', {
        method: projectId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || json?.message || 'Save failed');
      }
      await flushPendingMediaDeletes(
        pendingMediaDeletes.current,
        [contentHtml],
        [...(coverMediaId ? [coverMediaId] : []), ...galleryIds]
      );
      pendingMediaDeletes.current.clear();
      toast.success(projectId ? 'Đã cập nhật project' : 'Đã tạo project', {
        id: toastId
      });
      router.push('/dashboard/projects');
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
      <h1 className='text-2xl font-semibold'>{projectId ? 'Edit project' : 'New project'}</h1>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Title (list title)</span>
        <input
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Headline (detail H1)</span>
        <input
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </label>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Excerpt</span>
        <textarea
          className='min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </label>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Category</span>
        <select
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>
      <MediaCoverPicker
        value={coverMediaId}
        previewUrl={coverPreview}
        onChange={(id, url) => {
          if (coverMediaId && coverMediaId !== id) {
            pendingMediaDeletes.current.add(coverMediaId);
          }
          setCoverMediaId(id);
          setCoverPreview(url || null);
        }}
        onMediaDeleted={(mediaId) => {
          pendingMediaDeletes.current.delete(mediaId);
          if (coverMediaId === mediaId) {
            setCoverMediaId(undefined);
            setCoverPreview(null);
          }
        }}
      />
      <div className='space-y-1 text-sm'>
        <span className='font-medium'>Body content</span>
        <CmsRichTextEditor
          value={contentHtml}
          valueJson={contentJson}
          variant='project'
          onChange={(html, json) => {
            setContentHtml(html);
            setContentJson(json);
          }}
          onMediaRemoved={(mediaId) => {
            pendingMediaDeletes.current.add(mediaId);
          }}
        />
      </div>
      <MediaGalleryPicker
        value={galleryIds}
        previews={galleryPreviews}
        max={2}
        onChange={(ids, urls) => {
          const removed = galleryIds.filter((id) => !ids.includes(id));
          for (const id of removed) pendingMediaDeletes.current.add(id);
          setGalleryIds(ids);
          setGalleryPreviews(urls);
        }}
      />
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
