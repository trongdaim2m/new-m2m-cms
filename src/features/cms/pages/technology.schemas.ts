import { L, opts, type SectionSchema } from './section-schema';

const featureLine = () => ({ text: L() });

const visionTab = (id: 'polygon' | 'ivr' | 'game') => ({
  id,
  label: id === 'polygon' ? 'POLYGON VISIO' : id === 'ivr' ? 'AI IVR SYSTEM' : 'VIDEO GAME',
  title: id === 'polygon' ? 'POLYGON VISIO' : id === 'ivr' ? 'AI IVR SYSTEM' : 'VIDEO GAME',
  imageUrl: '',
  description: L(),
  features: [featureLine(), featureLine(), featureLine(), featureLine()],
});

export const TECHNOLOGY_SECTION_SCHEMAS: SectionSchema[] = [
  {
    key: 'hero',
    title: 'Hero',
    description: 'Banner TECHNOLOGY, mô tả và mục lục anchor.',
    fields: [
      { type: 'image', key: 'backgroundImageUrl', label: 'Ảnh nền' },
      { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
      {
        type: 'text',
        key: 'indexLabel',
        label: 'Nhãn mục lục (accessibility)',
        localized: true
      },
      {
        type: 'list',
        key: 'indexLinks',
        label: 'Mục lục',
        itemLabel: 'Mục',
        titleKey: 'label',
        newItem: () => ({ href: '#', label: '' }),
        fields: [
          { type: 'text', key: 'href', label: 'Anchor (VD: #physical-ai)' },
          { type: 'text', key: 'label', label: 'Nhãn hiển thị' }
        ]
      }
    ]
  },
  {
    key: 'physicalAi',
    title: 'Physical AI',
    description: 'Section Physical AI với accordion tính năng.',
    fields: [
      { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
      { type: 'image', key: 'imageUrl', label: 'Ảnh minh họa' },
      { type: 'text', key: 'imageAlt', label: 'Mô tả ảnh (alt)', localized: true },
      {
        type: 'list',
        key: 'features',
        label: 'Tính năng',
        itemLabel: 'Tính năng',
        titleKey: 'title',
        hint: 'Giữ 3 mục (predictive / fusion / edge) để icon hoạt động đúng.',
        newItem: () => ({
          id: 'predictive',
          icon: 'settings',
          title: L(),
          description: L()
        }),
        fields: [
          {
            type: 'select',
            key: 'id',
            label: 'ID',
            options: opts({
              predictive: 'predictive',
              fusion: 'fusion',
              edge: 'edge'
            })
          },
          {
            type: 'select',
            key: 'icon',
            label: 'Icon',
            options: opts({
              settings: 'Cài đặt (predictive)',
              layers: 'Layers (fusion)',
              cpu: 'CPU (edge)'
            })
          },
          { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true }
        ]
      }
    ]
  },
  {
    key: 'polygonVisio',
    title: 'Vision Automation',
    description: 'POLYGON VISION TECHNOLOGY và các tab POLYGON / IVR / VIDEO GAME.',
    fields: [
      { type: 'text', key: 'heading', label: 'Tiêu đề section', localized: true },
      { type: 'text', key: 'intro', label: 'Đoạn mở đầu', localized: true, multiline: true },
      { type: 'text', key: 'tabsLabel', label: 'Nhãn tab list (accessibility)', localized: true },
      {
        type: 'list',
        key: 'tabs',
        label: 'Tab',
        itemLabel: 'Tab',
        titleKey: 'label',
        hint: 'Khuyến nghị 3 tab với id polygon, ivr, game.',
        newItem: () => visionTab('polygon'),
        fields: [
          {
            type: 'select',
            key: 'id',
            label: 'ID tab',
            options: opts({ polygon: 'polygon', ivr: 'ivr', game: 'game' })
          },
          { type: 'text', key: 'label', label: 'Nhãn tab' },
          { type: 'text', key: 'title', label: 'Tiêu đề panel' },
          { type: 'image', key: 'imageUrl', label: 'Ảnh panel' },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
          {
            type: 'list',
            key: 'features',
            label: 'Bullet',
            itemLabel: 'Dòng',
            titleKey: 'text',
            newItem: featureLine,
            fields: [{ type: 'text', key: 'text', label: 'Nội dung', localized: true }]
          }
        ]
      }
    ]
  },
  {
    key: 'aiCamera',
    title: 'AI Camera',
    description: 'Banner AI Camera với tagline, badge và CTA.',
    fields: [
      { type: 'image', key: 'backgroundImageUrl', label: 'Ảnh nền' },
      { type: 'text', key: 'tagline', label: 'Tagline', localized: true, multiline: true },
      {
        type: 'list',
        key: 'badges',
        label: 'Badge',
        itemLabel: 'Badge',
        titleKey: 'text',
        newItem: featureLine,
        fields: [{ type: 'text', key: 'text', label: 'Nội dung', localized: true }]
      },
      { type: 'text', key: 'ctaLabel', label: 'Nhãn nút CTA', localized: true },
      { type: 'text', key: 'ctaHref', label: 'Link CTA', hint: 'VD: /#contact' }
    ]
  },
  {
    key: 'aiIvrAgent',
    title: 'AI-IVR & AI-Agent',
    description: 'Hai cột AI-IVR và AI-AGENT.',
    fields: [
      { type: 'text', key: 'sectionLabel', label: 'Nhãn section (accessibility)', localized: true },
      { type: 'text', key: 'ivrDescription', label: 'Mô tả AI-IVR', localized: true, multiline: true },
      { type: 'image', key: 'ivrImageUrl', label: 'Ảnh AI-IVR' },
      { type: 'text', key: 'ivrImageAlt', label: 'Alt ảnh IVR', localized: true },
      { type: 'text', key: 'agentDescription', label: 'Mô tả AI-Agent', localized: true, multiline: true },
      { type: 'image', key: 'agentImageUrl', label: 'Ảnh AI-Agent' },
      { type: 'text', key: 'agentImageAlt', label: 'Alt ảnh Agent', localized: true }
    ]
  }
];
