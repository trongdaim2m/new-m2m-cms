'use client';

import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { MediaUrlField } from './media-url-field';
import { getPageConfig, getSectionSchema } from './page-config';
import {
  CONTENT_LOCALES,
  type ContentLocale,
  type FieldDef,
  type LocalizedText,
  type Option
} from './section-schema';

type Content = Record<string, unknown>;

/** Whole section content, so fields can derive options from sibling lists. */
const SectionContentContext = createContext<Content>({});

type SectionResponse = {
  key: string;
  isVisible: boolean;
  content: Content;
  updatedAt: string;
};

const inputClass =
  'w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-[#22AAFF]';

function isLocalized(value: unknown): value is LocalizedText {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.ja === 'string' &&
    Object.keys(obj).every((k) => ['ja', 'en', 'vi'].includes(k) && typeof obj[k] === 'string')
  );
}

function toLocalized(value: unknown): LocalizedText {
  if (isLocalized(value)) return value;
  if (typeof value === 'string') return { ja: value, en: '', vi: '' };
  return { ja: '', en: '', vi: '' };
}

/** Localized leaves that are empty for `locale` while another language has text. */
function countMissing(value: unknown, locale: ContentLocale): number {
  if (isLocalized(value)) {
    const hasAny = Boolean(value.ja?.trim() || value.en?.trim() || value.vi?.trim());
    return hasAny && !value[locale]?.trim() ? 1 : 0;
  }
  if (Array.isArray(value)) return value.reduce((n, v) => n + countMissing(v, locale), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<number>((n, v) => n + countMissing(v, locale), 0);
  }
  return 0;
}

function displayText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (isLocalized(value)) return value.ja || value.en || value.vi || '';
  return '';
}

function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function PageSectionEditor({ page, sectionKey }: { page: string; sectionKey: string }) {
  const pageConfig = getPageConfig(page);
  const schema = getSectionSchema(page, sectionKey);
  const apiPath = `/api/cms/pages/${page}/sections/${sectionKey}`;
  const [content, setContent] = useState<Content | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const [locale, setLocale] = useState<ContentLocale>('ja');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const applyResponse = useCallback((data: SectionResponse) => {
    setContent(data.content);
    setIsVisible(data.isVisible);
    setUpdatedAt(data.updatedAt);
    setDirty(false);
  }, []);

  useEffect(() => {
    if (!schema) return;
    async function load() {
      try {
        const res = await fetch(apiPath);
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json?.error?.message || 'Không tải được section');
        }
        applyResponse(json.data as SectionResponse);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không tải được section');
      }
    }
    void load();
  }, [apiPath, schema, applyResponse]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  function updateField(key: string, value: unknown) {
    setContent((prev) => ({ ...(prev ?? {}), [key]: value }));
    setDirty(true);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    const toastId = toast.loading('Đang lưu…');
    try {
      const res = await fetch(apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible, content })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Lưu thất bại');
      }
      applyResponse(json.data as SectionResponse);
      toast.success('Đã lưu. Website cập nhật trong khoảng 30 giây.', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại', { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  if (!schema) {
    return <p className='p-6 text-sm text-red-600'>Section không tồn tại: {sectionKey}</p>;
  }

  if (!content) {
    return (
      <div className='flex items-center gap-2 p-6 text-sm text-muted-foreground'>
        <Spinner />
        Đang tải section…
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col gap-5 p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <Link
            href={`/dashboard/pages/${page}`}
            className='text-sm text-[#22AAFF] hover:underline'
          >
            ← {pageConfig?.title ?? page}
          </Link>
          <h1 className='mt-1 text-2xl font-semibold text-foreground'>{schema.title}</h1>
          <p className='text-sm text-muted-foreground'>{schema.description}</p>
          {updatedAt ? (
            <p className='mt-1 text-xs text-muted-foreground'>
              Cập nhật: {new Date(updatedAt).toLocaleString('vi-VN')}
            </p>
          ) : null}
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              className='size-4 accent-[#22AAFF]'
              checked={isVisible}
              onChange={(e) => {
                setIsVisible(e.target.checked);
                setDirty(true);
              }}
            />
            Hiển thị trên website
          </label>
          <button
            type='button'
            disabled={saving || !dirty}
            className='inline-flex items-center gap-2 rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB] disabled:opacity-50'
            onClick={() => void save()}
          >
            {saving ? <Spinner className='size-4 text-white' /> : null}
            {dirty ? 'Lưu thay đổi' : 'Đã lưu'}
          </button>
        </div>
      </div>

      <div className='sticky top-0 z-10 -mx-6 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-6 py-3 backdrop-blur'>
        <span className='mr-1 text-xs font-medium text-muted-foreground'>Ngôn ngữ đang sửa:</span>
        {CONTENT_LOCALES.map((item) => {
          const missing = countMissing(content, item.code);
          const active = item.code === locale;
          return (
            <button
              key={item.code}
              type='button'
              onClick={() => setLocale(item.code)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? 'border-[#22AAFF] bg-[#22AAFF] text-white'
                  : 'border-border hover:border-[#22AAFF]'
              }`}
            >
              {item.label}
              {missing > 0 ? (
                <span
                  className={`rounded-full px-1.5 text-[11px] ${
                    active ? 'bg-white/25' : 'bg-amber-500/15 text-amber-600'
                  }`}
                  title='Số trường chưa dịch'
                >
                  {missing} trống
                </span>
              ) : null}
            </button>
          );
        })}
        <span className='ml-auto text-xs text-muted-foreground'>
          Trường để trống ở EN/VI sẽ hiển thị bản JA.
        </span>
      </div>

      <SectionContentContext.Provider value={content}>
        <div className='flex max-w-4xl flex-col gap-5'>
          {schema.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={content[field.key]}
              locale={locale}
              onChange={(value) => updateField(field.key, value)}
            />
          ))}
        </div>
      </SectionContentContext.Provider>
    </div>
  );
}

type FieldRendererProps = {
  field: FieldDef;
  value: unknown;
  locale: ContentLocale;
  onChange: (value: unknown) => void;
};

function FieldRenderer({ field, value, locale, onChange }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <FieldShell label={field.label} hint={field.hint} localized={field.localized}>
          {field.localized ? (
            <LocalizedInput
              value={toLocalized(value)}
              locale={locale}
              multiline={field.multiline}
              onChange={onChange}
            />
          ) : field.multiline ? (
            <textarea
              className={`${inputClass} min-h-20`}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input
              className={inputClass}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </FieldShell>
      );

    case 'number':
      return (
        <FieldShell label={field.label}>
          <input
            type='number'
            className={`${inputClass} max-w-40`}
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
          />
        </FieldShell>
      );

    case 'boolean':
      return (
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            className='size-4 accent-[#22AAFF]'
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.label}
        </label>
      );

    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} />;

    case 'image':
      return (
        <FieldShell label={field.label} hint={field.hint}>
          <MediaUrlField value={typeof value === 'string' ? value : ''} onChange={onChange} />
        </FieldShell>
      );

    case 'group': {
      const obj = (value && typeof value === 'object' ? value : {}) as Content;
      return (
        <fieldset className='space-y-4 rounded-lg border border-border bg-card p-4'>
          <legend className='px-1 text-sm font-semibold'>{field.label}</legend>
          {field.fields.map((child) => (
            <FieldRenderer
              key={child.key}
              field={child}
              value={obj[child.key]}
              locale={locale}
              onChange={(next) => onChange({ ...obj, [child.key]: next })}
            />
          ))}
        </fieldset>
      );
    }

    case 'localizedList': {
      const list = Array.isArray(value) ? value.map(toLocalized) : [];
      return (
        <FieldShell label={field.label} hint={field.hint} localized>
          <div className='space-y-2'>
            {list.map((item, index) => (
              <div key={index} className='flex items-start gap-2'>
                <div className='flex-1'>
                  <LocalizedInput
                    value={item}
                    locale={locale}
                    onChange={(next) => onChange(list.map((v, i) => (i === index ? next : v)))}
                  />
                </div>
                <ItemActions
                  index={index}
                  length={list.length}
                  onMove={(delta) => onChange(move(list, index, delta))}
                  onRemove={() => onChange(list.filter((_, i) => i !== index))}
                />
              </div>
            ))}
            <button
              type='button'
              className='text-sm text-[#22AAFF] hover:underline'
              onClick={() => onChange([...list, { ja: '', en: '', vi: '' }])}
            >
              + Thêm ý
            </button>
          </div>
        </FieldShell>
      );
    }

    case 'list': {
      const list = (Array.isArray(value) ? value : []) as Content[];
      return (
        <div className='space-y-3 rounded-lg border border-border bg-card p-4'>
          <div>
            <h2 className='text-sm font-semibold'>
              {field.label}{' '}
              <span className='font-normal text-muted-foreground'>({list.length})</span>
            </h2>
            {field.hint ? <p className='text-xs text-muted-foreground'>{field.hint}</p> : null}
          </div>
          {list.map((item, index) => (
            <ListItem
              key={index}
              field={field}
              item={item}
              index={index}
              length={list.length}
              locale={locale}
              onChange={(next) => onChange(list.map((v, i) => (i === index ? next : v)))}
              onMove={(delta) => onChange(move(list, index, delta))}
              onRemove={() => {
                if (window.confirm(`Xoá ${field.itemLabel.toLowerCase()} #${index + 1}?`)) {
                  onChange(list.filter((_, i) => i !== index));
                }
              }}
            />
          ))}
          <button
            type='button'
            className='rounded-md border border-dashed border-border px-3 py-2 text-sm text-[#22AAFF] hover:border-[#22AAFF]'
            onClick={() => onChange([...list, field.newItem()])}
          >
            + Thêm {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
    }
  }
}

function SelectField({
  field,
  value,
  onChange
}: {
  field: Extract<FieldDef, { type: 'select' }>;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const sectionContent = useContext(SectionContentContext);
  const current = typeof value === 'string' ? value : '';

  let options: Option[] = field.options ?? [];
  if (field.optionsFrom) {
    const { listKey, valueKey, labelKey } = field.optionsFrom;
    const source = sectionContent[listKey];
    options = (Array.isArray(source) ? (source as Content[]) : [])
      .map((entry) => {
        const optionValue = typeof entry[valueKey] === 'string' ? (entry[valueKey] as string) : '';
        return { value: optionValue, label: displayText(entry[labelKey]) || optionValue };
      })
      .filter((option) => option.value);
  }
  const isMissing = current !== '' && !options.some((option) => option.value === current);

  return (
    <FieldShell label={field.label} hint={field.hint}>
      <select
        className={`${inputClass} max-w-xs`}
        value={current}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.optionsFrom ? <option value=''>— Chọn —</option> : null}
        {isMissing ? <option value={current}>{current} (không còn tồn tại)</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function ListItem({
  field,
  item,
  index,
  length,
  locale,
  onChange,
  onMove,
  onRemove
}: {
  field: Extract<FieldDef, { type: 'list' }>;
  item: Content;
  index: number;
  length: number;
  locale: ContentLocale;
  onChange: (value: Content) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const title = displayText(item[field.titleKey]) || '(chưa có tiêu đề)';

  return (
    <div className='rounded-md border border-border bg-background'>
      <div className='flex items-center gap-2 px-3 py-2'>
        <button
          type='button'
          className='flex min-w-0 flex-1 items-center gap-2 text-left text-sm'
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`text-xs transition ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className='text-muted-foreground'>#{index + 1}</span>
          <span className='truncate font-medium'>{title.replace(/\n/g, ' ')}</span>
        </button>
        <ItemActions index={index} length={length} onMove={onMove} onRemove={onRemove} />
      </div>
      {open ? (
        <div className='space-y-4 border-t border-border p-3'>
          {field.fields.map((child) => (
            <FieldRenderer
              key={child.key}
              field={child}
              value={item[child.key]}
              locale={locale}
              onChange={(next) => onChange({ ...item, [child.key]: next })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ItemActions({
  index,
  length,
  onMove,
  onRemove
}: {
  index: number;
  length: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className='flex shrink-0 items-center gap-1 text-xs'>
      <button
        type='button'
        title='Lên'
        disabled={index === 0}
        className='rounded px-1.5 py-1 text-muted-foreground hover:bg-muted disabled:opacity-30'
        onClick={() => onMove(-1)}
      >
        ↑
      </button>
      <button
        type='button'
        title='Xuống'
        disabled={index === length - 1}
        className='rounded px-1.5 py-1 text-muted-foreground hover:bg-muted disabled:opacity-30'
        onClick={() => onMove(1)}
      >
        ↓
      </button>
      <button
        type='button'
        className='rounded px-1.5 py-1 text-red-600 hover:bg-red-500/10'
        onClick={onRemove}
      >
        Xoá
      </button>
    </div>
  );
}

function FieldShell({
  label,
  hint,
  localized,
  children
}: {
  label: string;
  hint?: string;
  localized?: boolean;
  children: ReactNode;
}) {
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center gap-2 text-sm font-medium'>
        {label}
        {localized ? (
          <span className='rounded bg-[#22AAFF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#22AAFF]'>
            đa ngôn ngữ
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
    </div>
  );
}

function LocalizedInput({
  value,
  locale,
  multiline,
  onChange
}: {
  value: LocalizedText;
  locale: ContentLocale;
  multiline?: boolean;
  onChange: (value: LocalizedText) => void;
}) {
  const current = value[locale] ?? '';
  const reference = locale === 'ja' ? '' : value.ja;
  const update = (text: string) => onChange({ ...value, [locale]: text });

  return (
    <div className='space-y-1'>
      {multiline ? (
        <textarea
          className={`${inputClass} min-h-20`}
          value={current}
          placeholder={reference}
          onChange={(e) => update(e.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          value={current}
          placeholder={reference}
          onChange={(e) => update(e.target.value)}
        />
      )}
      {reference ? (
        <p className='line-clamp-2 text-[11px] text-muted-foreground'>
          <span className='font-semibold'>JA:</span> {reference}
        </p>
      ) : null}
    </div>
  );
}
