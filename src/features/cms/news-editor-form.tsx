'use client';

import { CmsRichTextEditor } from '@/features/cms/cms-rich-text-editor';
import { flushPendingMediaDeletes } from '@/features/cms/flush-pending-media';
import { MediaCoverPicker } from '@/features/cms/media-cover-picker';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Category = { id: string; name: string; slug: string };

type Props = {
  articleId?: string;
};

export function NewsEditorForm({ articleId }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contentHtml, setContentHtml] = useState('<p></p>');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({
    type: 'doc',
    content: [{ type: 'paragraph' }]
  });
  const [coverMediaId, setCoverMediaId] = useState<string | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingMediaDeletes = useRef<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      const catsRes = await fetch('/api/cms/news/categories');
      const catsJson = await catsRes.json();
      const cats = (catsJson.data || []) as Category[];
      setCategories(cats);
      if (cats[0] && !categoryId) setCategoryId(cats[0].id);

      if (articleId) {
        const res = await fetch(`/api/cms/news/${articleId}`);
        const json = await res.json();
        const article = json.data;
        if (article) {
          setTitle(article.title || '');
          setExcerpt(article.excerpt || '');
          setCategoryId(article.categoryId || '');
          setContentHtml(article.contentHtml || '<p></p>');
          if (article.contentJson) setContentJson(article.contentJson);
          setCoverMediaId(article.coverMediaId || undefined);
          setCoverPreview(article.coverMedia?.url || null);
          setIsFeatured(Boolean(article.isFeatured));
          setStatus(article.status === 'published' ? 'published' : 'draft');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const toastId = toast.loading(articleId ? 'Đang cập nhật bài…' : 'Đang tạo bài…');
    try {
      const payload = {
        title,
        excerpt,
        categoryId,
        contentHtml,
        contentJson,
        isFeatured,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
        coverMediaId: coverMediaId ?? null
      };

      const res = await fetch(articleId ? `/api/cms/news/${articleId}` : '/api/cms/news', {
        method: articleId ? 'PATCH' : 'POST',
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
        coverMediaId ? [coverMediaId] : []
      );
      pendingMediaDeletes.current.clear();
      toast.success(articleId ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết', {
        id: toastId
      });
      router.push('/dashboard/news');
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
      <h1 className='text-2xl font-semibold'>{articleId ? 'Edit article' : 'New article'}</h1>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Title</span>
        <input
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
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
        <span className='font-medium'>Content</span>
        <CmsRichTextEditor
          value={contentHtml}
          valueJson={contentJson}
          variant='news'
          onChange={(html, json) => {
            setContentHtml(html);
            setContentJson(json);
          }}
          onMediaRemoved={(mediaId) => {
            pendingMediaDeletes.current.add(mediaId);
          }}
        />
      </div>
      <label className='flex items-center gap-2 text-sm'>
        <input
          type='checkbox'
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
        Featured on news page
      </label>
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
