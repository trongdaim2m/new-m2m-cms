import { L, opts, type SectionSchema } from './section-schema';

const IMAGE_HINT = 'Để trống để dùng icon mặc định bên trên.';

export const HOME_SECTION_SCHEMAS: SectionSchema[] = [
  {
    key: 'hero',
    title: 'Hero',
    description: 'Banner đầu trang: tiêu đề, mô tả, nút CTA và 3 chỉ số.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
      { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
      { type: 'text', key: 'ctaLabel', label: 'Nhãn nút CTA', localized: true },
      {
        type: 'text',
        key: 'ctaHref',
        label: 'Link nút CTA',
        hint: 'VD: /#services, /about, https://…'
      },
      {
        type: 'list',
        key: 'stats',
        label: 'Chỉ số',
        itemLabel: 'Chỉ số',
        titleKey: 'label',
        hint: 'Thiết kế tối ưu cho 3 chỉ số; màu thanh lặp theo thứ tự xanh / cam / tím.',
        newItem: () => ({ value: 0, suffix: '+', label: L() }),
        fields: [
          { type: 'number', key: 'value', label: 'Giá trị' },
          { type: 'text', key: 'suffix', label: 'Hậu tố (VD: +, %)' },
          { type: 'text', key: 'label', label: 'Nhãn', localized: true }
        ]
      }
    ]
  },
  {
    key: 'groupCompany',
    title: 'Group Company',
    description: 'Các công ty trong group (desktop hiển thị dạng quạt khi có đúng 3 thẻ).',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề section', localized: true },
      { type: 'text', key: 'exploreLabel', label: 'Nhãn "Explore Now"', localized: true },
      { type: 'text', key: 'currentLabel', label: 'Nhãn "You are here"', localized: true },
      {
        type: 'list',
        key: 'companies',
        label: 'Công ty',
        itemLabel: 'Công ty',
        titleKey: 'name',
        newItem: () => ({
          name: '',
          description: L(),
          accent: '',
          theme: 'blue',
          href: '',
          current: false
        }),
        fields: [
          { type: 'text', key: 'name', label: 'Tên công ty' },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
          { type: 'text', key: 'accent', label: 'Chữ chìm (VD: M2M)' },
          {
            type: 'select',
            key: 'theme',
            label: 'Màu thẻ',
            options: opts({ orange: 'Cam', blue: 'Xanh dương', purple: 'Tím' })
          },
          { type: 'text', key: 'href', label: 'Link', hint: 'https://… hoặc # nếu chưa có' },
          {
            type: 'boolean',
            key: 'current',
            label: 'Là công ty hiện tại (hiển thị "You are here")'
          }
        ]
      }
    ]
  },
  {
    key: 'platform',
    title: 'Our Platform',
    description: 'Danh sách nền tảng; số thứ tự 01, 02… tự sinh theo vị trí.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề section', localized: true },
      { type: 'text', key: 'moreLabel', label: 'Nhãn "Xem thêm"', localized: true },
      {
        type: 'list',
        key: 'items',
        label: 'Nền tảng',
        itemLabel: 'Nền tảng',
        titleKey: 'title',
        newItem: () => ({ title: L(), description: L(), href: '#', icon: 'people', imageUrl: '' }),
        fields: [
          { type: 'text', key: 'title', label: 'Tên', localized: true },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
          {
            type: 'text',
            key: 'href',
            label: 'Link',
            hint: 'Link https:// sẽ mở tab mới; # = không có link'
          },
          {
            type: 'select',
            key: 'icon',
            label: 'Icon mặc định',
            options: opts({
              people: 'Con người (HRM)',
              ai: 'AI',
              jobs: 'Việc làm',
              cart: 'Giỏ hàng (EC)',
              hub: 'Kết nối (Hub)',
              vision: 'Camera / Vision'
            })
          },
          { type: 'image', key: 'imageUrl', label: 'Ảnh thumbnail (tuỳ chọn)', hint: IMAGE_HINT }
        ]
      }
    ]
  },
  {
    key: 'service',
    title: 'Our Service',
    description: 'Mô tả chung và danh sách dịch vụ dạng accordion.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề section', localized: true },
      { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
      {
        type: 'list',
        key: 'items',
        label: 'Dịch vụ',
        itemLabel: 'Dịch vụ',
        titleKey: 'title',
        newItem: () => ({ title: L(), description: L(), icon: 'web', imageUrl: '' }),
        fields: [
          { type: 'text', key: 'title', label: 'Tên dịch vụ', localized: true },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
          {
            type: 'select',
            key: 'icon',
            label: 'Icon mặc định',
            options: opts({
              web: 'Web',
              server: 'Server',
              app: 'App',
              'ai-iot': 'AI / IoT',
              crm: 'CRM',
              backup: 'Backup',
              staffing: 'Nhân sự'
            })
          },
          { type: 'image', key: 'imageUrl', label: 'Icon ảnh (tuỳ chọn)', hint: IMAGE_HINT }
        ]
      }
    ]
  },
  {
    key: 'technology',
    title: 'Technology',
    description: 'Lưới logo công nghệ. Mobile: hàng 4 logo; desktop hiển thị 9 logo đầu (4 + 5).',
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Tiêu đề (ẩn, dùng cho accessibility)',
        localized: true
      },
      {
        type: 'list',
        key: 'items',
        label: 'Logo',
        itemLabel: 'Logo',
        titleKey: 'name',
        newItem: () => ({ name: '', icon: '', imageUrl: '' }),
        fields: [
          { type: 'text', key: 'name', label: 'Tên công nghệ' },
          {
            type: 'select',
            key: 'icon',
            label: 'Logo có sẵn',
            options: [
              { value: '', label: '— Không (dùng ảnh hoặc hiển thị tên) —' },
              ...opts({
                nodejs: 'Node.js',
                laravel: 'Laravel',
                django: 'Django',
                spring: 'Spring',
                angular: 'Angular',
                aws: 'AWS',
                azure: 'Azure',
                outsystems: 'OutSystems',
                sap: 'SAP ERP',
                react: 'React',
                vue: 'Vue.js',
                nextjs: 'Next.js'
              })
            ]
          },
          {
            type: 'image',
            key: 'imageUrl',
            label: 'Logo ảnh (tuỳ chọn)',
            hint: 'Ưu tiên ảnh nếu có; nên dùng PNG/SVG nền trong suốt.'
          }
        ]
      }
    ]
  },
  {
    key: 'why',
    title: 'Why M&M Solutions',
    description: 'Các điểm mạnh; xuống dòng trong tiêu đề để ngắt dòng trên web.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề section', localized: true },
      {
        type: 'list',
        key: 'items',
        label: 'Điểm mạnh',
        itemLabel: 'Điểm mạnh',
        titleKey: 'title',
        newItem: () => ({ title: L(), icon: 'platform', imageUrl: '' }),
        fields: [
          {
            type: 'text',
            key: 'title',
            label: 'Tiêu đề',
            localized: true,
            multiline: true,
            hint: 'Mỗi dòng hiển thị trên 1 dòng riêng.'
          },
          {
            type: 'select',
            key: 'icon',
            label: 'Hình minh hoạ mặc định',
            options: opts({
              platform: 'Nền tảng xếp chồng',
              onestop: 'One-stop',
              commitment: 'Mục tiêu / cam kết'
            })
          },
          { type: 'image', key: 'imageUrl', label: 'Ảnh minh hoạ (tuỳ chọn)', hint: IMAGE_HINT }
        ]
      }
    ]
  },
  {
    key: 'talentBridge',
    title: 'Talent Bridge',
    description: 'Cầu nối nhân lực Việt Nam – Nhật Bản.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
      {
        type: 'text',
        key: 'subtitle',
        label: 'Mô tả (tablet/desktop)',
        localized: true,
        multiline: true
      },
      {
        type: 'text',
        key: 'subtitleMobile',
        label: 'Mô tả ngắn (mobile)',
        localized: true,
        multiline: true
      },
      { type: 'image', key: 'backgroundImageUrl', label: 'Ảnh nền' },
      {
        type: 'group',
        key: 'vietnam',
        label: 'Thẻ Việt Nam',
        fields: [
          { type: 'text', key: 'country', label: 'Tên quốc gia', localized: true },
          { type: 'text', key: 'subtitle', label: 'Phụ đề', localized: true },
          { type: 'localizedList', key: 'bullets', label: 'Các ý' }
        ]
      },
      {
        type: 'group',
        key: 'japan',
        label: 'Thẻ Nhật Bản',
        fields: [
          { type: 'text', key: 'country', label: 'Tên quốc gia', localized: true },
          { type: 'text', key: 'subtitle', label: 'Phụ đề', localized: true },
          { type: 'localizedList', key: 'bullets', label: 'Các ý' }
        ]
      },
      {
        type: 'group',
        key: 'hub',
        label: 'Vòng tròn trung tâm',
        fields: [
          { type: 'text', key: 'brand', label: 'Thương hiệu' },
          { type: 'text', key: 'tagline', label: 'Tagline', localized: true }
        ]
      },
      {
        type: 'list',
        key: 'steps',
        label: 'Các bước quy trình (xếp đều quanh vòng tròn)',
        itemLabel: 'Bước',
        titleKey: 'label',
        newItem: () => ({ label: L(), icon: 'search' }),
        fields: [
          { type: 'text', key: 'label', label: 'Nhãn', localized: true },
          {
            type: 'select',
            key: 'icon',
            label: 'Icon',
            options: opts({
              search: 'Tìm kiếm',
              users: 'Người',
              clipboard: 'Clipboard',
              file: 'Hồ sơ',
              graduation: 'Đào tạo',
              handshake: 'Bắt tay'
            })
          }
        ]
      },
      {
        type: 'list',
        key: 'features',
        label: 'Điểm nổi bật (hàng dưới)',
        itemLabel: 'Điểm nổi bật',
        titleKey: 'title',
        newItem: () => ({ title: L(), description: L(), icon: 'shield', imageUrl: '' }),
        fields: [
          { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
          {
            type: 'select',
            key: 'icon',
            label: 'Icon mặc định',
            options: opts({
              shield: 'Khiên / hỗ trợ',
              collab: 'Hợp tác',
              team: 'Đội ngũ',
              stars: 'Thành tích'
            })
          },
          { type: 'image', key: 'imageUrl', label: 'Icon ảnh (tuỳ chọn)', hint: IMAGE_HINT }
        ]
      }
    ]
  },
  {
    key: 'contact',
    title: 'Get In Touch',
    description: 'Tiêu đề, mô tả và toàn bộ nhãn của form liên hệ.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
      {
        type: 'text',
        key: 'description',
        label: 'Mô tả',
        localized: true,
        multiline: true,
        hint: 'Mỗi dòng là một đoạn trên desktop.'
      },
      { type: 'text', key: 'formTitle', label: 'Tiêu đề form', localized: true },
      { type: 'text', key: 'formSubtitle', label: 'Phụ đề form', localized: true },
      { type: 'text', key: 'nameLabel', label: 'Nhãn "Họ tên"', localized: true },
      { type: 'text', key: 'emailLabel', label: 'Nhãn "Email"', localized: true },
      { type: 'text', key: 'messageLabel', label: 'Nhãn "Nội dung"', localized: true },
      {
        type: 'text',
        key: 'privacyNote',
        label: 'Ghi chú bảo mật',
        localized: true,
        multiline: true
      },
      { type: 'text', key: 'submitLabel', label: 'Nút gửi', localized: true },
      { type: 'text', key: 'submittingLabel', label: 'Nút gửi (đang gửi)', localized: true },
      {
        type: 'text',
        key: 'successMessage',
        label: 'Thông báo thành công',
        localized: true,
        multiline: true
      },
      { type: 'text', key: 'errorMessage', label: 'Thông báo lỗi', localized: true }
    ]
  }
];
