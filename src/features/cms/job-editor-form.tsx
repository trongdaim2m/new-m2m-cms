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
import { CONTENT_LOCALES, type ContentLocale } from '@/features/cms/pages/section-schema';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type JobLevel = 'Junior' | 'Middle' | 'Senior';

type Props = {
  jobId?: string;
};

/** The public site only recognizes (and translates) these values. */
const LOCATIONS = ['Japan', 'Vietnam'];

const RICH_FIELDS = [
  { key: 'description', label: 'Description', placeholder: undefined },
  { key: 'responsibilities', label: 'Responsibilities', placeholder: 'Bullet list trách nhiệm…' },
  { key: 'benefits', label: 'Benefits', placeholder: 'Bullet list quyền lợi…' }
] as const;

type RichKey = (typeof RICH_FIELDS)[number]['key'];
type RichValue = { html: string; json: Record<string, unknown> };
type LocaleContent = { title: string } & Record<RichKey, RichValue>;

function emptyRich(): RichValue {
  return { html: '<p></p>', json: EMPTY_DOC };
}

function emptyContent(): LocaleContent {
  return {
    title: '',
    description: emptyRich(),
    responsibilities: emptyRich(),
    benefits: emptyRich()
  };
}

function readContent(source: Record<string, unknown>): LocaleContent {
  const rich = (key: RichKey): RichValue => ({
    html: str(source[`${key}Html`]) || '<p></p>',
    json: toDoc(source[`${key}Json`])
  });
  return {
    title: str(source.title),
    description: rich('description'),
    responsibilities: rich('responsibilities'),
    benefits: rich('benefits')
  };
}

/** API shape: `title` + `${key}Html` / `${key}Json` per rich field. */
function toPayload(content: LocaleContent) {
  const out: Record<string, unknown> = { title: content.title };
  for (const { key } of RICH_FIELDS) {
    out[`${key}Html`] = content[key].html;
    out[`${key}Json`] = content[key].json;
  }
  return out;
}

function isFilled(content: LocaleContent) {
  return Boolean(content.title.trim() || RICH_FIELDS.some(({ key }) => hasBody(content[key].html)));
}

function countMissing(all: Record<ContentLocale, LocaleContent>, locale: ContentLocale) {
  const ja = all.ja;
  const cur = all[locale];
  let missing = ja.title.trim() && !cur.title.trim() ? 1 : 0;
  for (const { key } of RICH_FIELDS) {
    if (hasBody(ja[key].html) && !hasBody(cur[key].html)) missing++;
  }
  return missing;
}

export function JobEditorForm({ jobId }: Props) {
  const router = useRouter();
  const [locale, setLocale] = useState<ContentLocale>('ja');
  const [content, setContent] = useState(() => perLocale(emptyContent));
  const [level, setLevel] = useState<JobLevel>('Junior');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingMediaDeletes = useRef<Set<string>>(new Set());

  const current = content[locale];
  const jaRef = locale === 'ja' ? null : content.ja;

  function updateCurrent(patch: Partial<LocaleContent>) {
    setContent((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

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
        setContent({
          ja: readContent(job),
          en: readContent(readTranslation(job.translations, 'en')),
          vi: readContent(readTranslation(job.translations, 'vi'))
        });
        setLevel((job.level as JobLevel) || 'Junior');
        setLocation(job.location || LOCATIONS[0]);
        setStatus(job.status === 'published' ? 'published' : 'draft');
      }
    })();
  }, [jobId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.ja.title.trim()) {
      setLocale('ja');
      setError('Cần nhập tiêu đề tiếng Nhật (JA) — bản EN/VI để trống sẽ hiển thị bản JA.');
      return;
    }
    setLoading(true);
    setError('');
    const toastId = toast.loading(jobId ? 'Đang cập nhật job…' : 'Đang tạo job…');
    try {
      const translations: Partial<Record<TranslationLocale, Record<string, unknown>>> = {};
      for (const code of TRANSLATION_LOCALES) {
        if (isFilled(content[code])) translations[code] = toPayload(content[code]);
      }
      const payload = {
        ...toPayload(content.ja),
        level,
        location,
        translations,
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
      await flushPendingMediaDeletes(
        pendingMediaDeletes.current,
        CONTENT_LOCALES.flatMap((item) => RICH_FIELDS.map(({ key }) => content[item.code][key].html))
      );
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
      {RICH_FIELDS.map(({ key, label, placeholder }) => (
        <div key={key} className='space-y-1 text-sm'>
          <span className='font-medium'>
            {label} ({locale.toUpperCase()})
          </span>
          <CmsRichTextEditor
            key={`${key}-${locale}`}
            value={current[key].html}
            valueJson={current[key].json}
            variant='career'
            minHeightClassName='min-h-[160px]'
            placeholder={placeholder}
            onChange={(html, json) => updateCurrent({ [key]: { html, json } })}
            onMediaRemoved={queueMediaDelete}
          />
        </div>
      ))}

      <div className='mt-2 space-y-4 border-t border-border pt-4'>
        <p className='text-xs text-muted-foreground'>Các trường dưới đây dùng chung cho cả 3 ngôn ngữ.</p>
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
            <select
              className='w-full rounded-md border border-border bg-background px-3 py-2 text-foreground'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              {(LOCATIONS.includes(location) ? LOCATIONS : [...LOCATIONS, location]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
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
