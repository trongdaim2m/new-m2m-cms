export const CONTENT_LOCALES = [
  { code: 'ja', label: 'JA · 日本語' },
  { code: 'en', label: 'EN · English' },
  { code: 'vi', label: 'VI · Tiếng Việt' }
] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number]['code'];

export type LocalizedText = { ja: string; en?: string; vi?: string };

export type Option = { value: string; label: string };

export type FieldDef =
  | {
      type: 'text';
      key: string;
      label: string;
      localized?: boolean;
      multiline?: boolean;
      hint?: string;
    }
  | { type: 'number'; key: string; label: string }
  | { type: 'boolean'; key: string; label: string; hint?: string }
  | {
      type: 'select';
      key: string;
      label: string;
      options?: Option[];
      /** Builds options from a top-level list in the same section (e.g. team categories). */
      optionsFrom?: { listKey: string; valueKey: string; labelKey: string };
      hint?: string;
    }
  | { type: 'image'; key: string; label: string; hint?: string }
  | { type: 'group'; key: string; label: string; fields: FieldDef[] }
  | { type: 'localizedList'; key: string; label: string; hint?: string }
  | {
      type: 'list';
      key: string;
      label: string;
      itemLabel: string;
      /** Field whose value titles each collapsed item. */
      titleKey: string;
      fields: FieldDef[];
      newItem: () => Record<string, unknown>;
      hint?: string;
    };

export type SectionSchema = {
  key: string;
  title: string;
  description: string;
  fields: FieldDef[];
};

export const L = (): LocalizedText => ({ ja: '', en: '', vi: '' });

export const opts = (entries: Record<string, string>): Option[] =>
  Object.entries(entries).map(([value, label]) => ({ value, label }));
