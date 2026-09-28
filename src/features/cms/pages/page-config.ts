import { ABOUT_SECTION_SCHEMAS } from './about.schemas';
import { HOME_SECTION_SCHEMAS } from './home.schemas';
import type { SectionSchema } from './section-schema';

type PageConfig = {
  title: string;
  description: string;
  sections: SectionSchema[];
};

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  home: {
    title: 'Homepage',
    description: 'Sắp xếp, ẩn/hiện và chỉnh sửa nội dung các section trang chủ (JA / EN / VI).',
    sections: HOME_SECTION_SCHEMAS
  },
  about: {
    title: 'About',
    description: 'Sắp xếp, ẩn/hiện và chỉnh sửa nội dung các section trang About (JA / EN / VI).',
    sections: ABOUT_SECTION_SCHEMAS
  }
};

export function getPageConfig(page: string): PageConfig | undefined {
  return Object.prototype.hasOwnProperty.call(PAGE_CONFIGS, page) ? PAGE_CONFIGS[page] : undefined;
}

export function getSectionSchema(page: string, key: string) {
  return getPageConfig(page)?.sections.find((schema) => schema.key === key);
}
