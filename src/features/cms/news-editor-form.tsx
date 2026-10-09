'use client';

import { CmsRichTextEditor } from '@/features/cms/cms-rich-text-editor';
import { flushPendingMediaDeletes } from '@/features/cms/flush-pending-media';
import {
  EMPTY_DOC,
  hasBody,
  LocaleTabs,
  perLocale,
  readTranslation,
  str,
  toDoc,
  TRANSLATION_LOCALES,
  type TranslationLocale
} from '@/features/cms/locale-tabs';
import { MediaCoverPicker } from '@/features/cms/media-cover-picker';
import { CONTENT_LOCALES, type ContentLocale } from '@/features/cms/pages/section-schema';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Category = { id: string; name: string; slug: string };

type Props = {
  articleId?: string;
};

type LocaleContent = {
  title: string;
  excerpt: string;
  contentHtml: string;
  contentJson: Record<string, unknown>;
};

function emptyContent(): LocaleContent {
  return { title: '', excerpt: '', contentHtml: '<p></p>', contentJson: EMPTY_DOC };
}

function isFilled(content: LocaleContent) {
  return Boolean(content.title.trim() || content.excerpt.trim() || hasBody(content.contentHtml));
}

function countMissing(all: Record<ContentLocale, LocaleContent>, locale: ContentLocale) {
  const ja = all.ja;
  const cur = all[locale];
  let missing = 0;
  if (ja.title.trim() && !cur.title.trim()) missing++;
  if (ja.excerpt.trim() && !cur.excerpt.trim()) missing++;
  if (hasBody(ja.contentHtml) && !hasBody(cur.contentHtml)) missing++;
  return missing;
}

function toDateInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NewsEditorForm({ articleId }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locale, setLocale] = useState<ContentLocale>('ja');
  const [content, setContent] = useState(() => perLocale(emptyContent));
  const [categoryId, setCategoryId] = useState('');
  const [coverMediaId, setCoverMediaId] = useState<string | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [publishedDate, setPublishedDate] = useState('');
  const [loadedPublishedAt, setLoadedPublishedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingMediaDeletes = useRef<Set<string>>(new Set());

  const current = content[locale];
  const jaRef = locale === 'ja' ? null : content.ja;

  function updateCurrent(patch: Partial<LocaleContent>) {
    setContent((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

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
          const fromTranslation = (code: TranslationLocale): LocaleContent => {
            const t = readTranslation(article.translations, code);
            return {
              title: str(t.title),
              excerpt: str(t.excerpt),
              contentHtml: str(t.contentHtml) || '<p></p>',
              contentJson: toDoc(t.contentJson)
            };
          };
          setContent({
            ja: {
              title: article.title || '',
              excerpt: article.excerpt || '',
              contentHtml: article.contentHtml || '<p></p>',
              contentJson: article.contentJson || EMPTY_DOC
            },
            en: fromTranslation('en'),
            vi: fromTranslation('vi')
          });
          setCategoryId(article.categoryId || '');
          setCoverMediaId(article.coverMediaId || undefined);
          setCoverPreview(article.coverMedia?.url || null);
          setIsFeatured(Boolean(article.isFeatured));
          setStatus(article.status === 'published' ? 'published' : 'draft');
          setLoadedPublishedAt(article.publishedAt || null);
          setPublishedDate(toDateInput(article.publishedAt || null));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  function resolvePublishedAt() {
    if (publishedDate && publishedDate === toDateInput(loadedPublishedAt)) return loadedPublishedAt;
    if (publishedDate) return new Date(`${publishedDate}T00:00:00`).toISOString();
    return status === 'published' ? new Date().toISOString() : null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.ja.title.trim()) {
      setLocale('ja');
      setError('Cần nhập tiêu đề tiếng Nhật (JA) — bản EN/VI để trống sẽ hiển thị bản JA.');
      return;
    }
    setLoading(true);
    setError('');
    const toastId = toast.loading(articleId ? 'Đang cập nhật bài…' : 'Đang tạo bài…');
    try {
      const translations: Partial<Record<TranslationLocale, LocaleContent>> = {};
      for (const code of TRANSLATION_LOCALES) {
        if (isFilled(content[code])) translations[code] = content[code];
      }
      const payload = {
        title: content.ja.title,
        excerpt: content.ja.excerpt,
        categoryId,
        contentHtml: content.ja.contentHtml,
        contentJson: content.ja.contentJson,
        translations,
        isFeatured,
        status,
        publishedAt: resolvePublishedAt(),
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
        CONTENT_LOCALES.map((item) => content[item.code].contentHtml),
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

      <LocaleTabs
        value={locale}
        onChange={setLocale}
        missing={(code) => countMissing(content, code)}
      />

      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Title ({locale.toUpperCase()})</span>
        <input
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={current.title}
          placeholder={jaRef?.title}
          onChange={(e) => updateCurrent({ title: e.target.value })}
          required={locale === 'ja'}
        />
      </label>
      <label className='space-y-1 text-sm'>
        <span className='font-medium'>Excerpt ({locale.toUpperCase()})</span>
        <textarea
          className='min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
          value={current.excerpt}
          placeholder={jaRef?.excerpt}
          onChange={(e) => updateCurrent({ excerpt: e.target.value })}
        />
      </label>
      <div className='space-y-1 text-sm'>
        <span className='font-medium'>Content ({locale.toUpperCase()})</span>
        <CmsRichTextEditor
          key={locale}
          value={current.contentHtml}
          valueJson={current.contentJson}
          variant='news'
          onChange={(html, json) => updateCurrent({ contentHtml: html, contentJson: json })}
          onMediaRemoved={(mediaId) => {
            pendingMediaDeletes.current.add(mediaId);
          }}
        />
      </div>

      <div className='mt-2 space-y-4 border-t border-border pt-4'>
        <p className='text-xs text-muted-foreground'>Các trường dưới đây dùng chung cho cả 3 ngôn ngữ.</p>
        <label className='block space-y-1 text-sm'>
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
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured on news page
        </label>
        <label className='block space-y-1 text-sm'>
          <span className='font-medium'>Ngày đăng</span>
          <input
            type='date'
            className='w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-foreground'
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
          />
          <span className='block text-xs text-muted-foreground'>
            Để trống = ngày bấm Save. Khi chuyển bài từ web cũ, nhập ngày đăng gốc để giữ đúng thứ tự.
          </span>
        </label>
        <label className='block space-y-1 text-sm'>
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
      </div>
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
