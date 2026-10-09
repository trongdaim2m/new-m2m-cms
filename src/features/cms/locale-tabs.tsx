'use client';

import { CONTENT_LOCALES, type ContentLocale } from '@/features/cms/pages/section-schema';

export type TranslationLocale = Exclude<ContentLocale, 'ja'>;
export const TRANSLATION_LOCALES: TranslationLocale[] = ['en', 'vi'];

export const EMPTY_DOC: Record<string, unknown> = { type: 'doc', content: [{ type: 'paragraph' }] };

/** True when the HTML renders something (text or an image), not just empty paragraphs. */
export function hasBody(html: string) {
  return /<img\b/i.test(html) || html.replace(/<[^>]+>/g, '').trim().length > 0;
}

export function toDoc(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : EMPTY_DOC;
}

export function perLocale<T>(make: () => T): Record<ContentLocale, T> {
  return { ja: make(), en: make(), vi: make() };
}

/** The raw `translations[code]` entry of an API record, or `{}`. */
export function readTranslation(translations: unknown, code: TranslationLocale) {
  const entry =
    translations && typeof translations === 'object'
      ? (translations as Record<string, unknown>)[code]
      : undefined;
  return (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
}

export function str(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function LocaleTabs({
  value,
  onChange,
  missing
}: {
  value: ContentLocale;
  onChange: (locale: ContentLocale) => void;
  /** Number of fields left empty in `locale` while the JA version has them. */
  missing: (locale: ContentLocale) => number;
}) {
  return (
    <div className='sticky top-0 z-20 -mx-6 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-6 py-3 backdrop-blur'>
      <span className='mr-1 text-xs font-medium text-muted-foreground'>Ngôn ngữ đang sửa:</span>
      {CONTENT_LOCALES.map((item) => {
        const count = item.code === 'ja' ? 0 : missing(item.code);
        const active = item.code === value;
        return (
          <button
            key={item.code}
            type='button'
            onClick={() => onChange(item.code)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
              active ? 'border-[#22AAFF] bg-[#22AAFF] text-white' : 'border-border hover:border-[#22AAFF]'
            }`}
          >
            {item.label}
            {count > 0 ? (
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  active ? 'bg-white/25' : 'bg-amber-500/15 text-amber-600'
                }`}
                title='Số trường chưa dịch'
              >
                {count} trống
              </span>
            ) : null}
          </button>
        );
      })}
      <span className='ml-auto text-xs text-muted-foreground'>
        Trường để trống ở EN/VI sẽ hiển thị bản JA.
      </span>
    </div>
  );
}
