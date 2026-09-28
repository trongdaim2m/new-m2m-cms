import { L, opts, type SectionSchema } from './section-schema';

export const ABOUT_SECTION_SCHEMAS: SectionSchema[] = [
  {
    key: 'hero',
    title: 'Hero',
    description: 'Slogan và bộ ảnh collage; desktop chia ảnh thành từng nhóm 5 ảnh cuộn lần lượt.',
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Slogan',
        localized: true,
        multiline: true,
        hint: 'Desktop: mỗi dòng hiển thị trên 1 dòng riêng. Mobile: các dòng được nối liền.'
      },
      {
        type: 'list',
        key: 'photos',
        label: 'Ảnh collage',
        itemLabel: 'Ảnh',
        titleKey: 'alt',
        hint: 'Nên dùng bội số của 5 (VD: 10, 15) để mỗi nhóm trên desktop đủ 5 ảnh.',
        newItem: () => ({ imageUrl: '', alt: L() }),
        fields: [
          { type: 'image', key: 'imageUrl', label: 'Ảnh' },
          { type: 'text', key: 'alt', label: 'Mô tả ảnh (alt)', localized: true }
        ]
      }
    ]
  },
  {
    key: 'ceoMessage',
    title: 'CEO Message',
    description: 'Lời nhắn của người đại diện kèm ảnh chân dung.',
    fields: [
      {
        type: 'text',
        key: 'heading',
        label: 'Tiêu đề (ẩn, dùng cho accessibility)',
        localized: true
      },
      { type: 'text', key: 'message', label: 'Lời nhắn', localized: true, multiline: true },
      { type: 'text', key: 'signature', label: 'Chức danh & tên', localized: true },
      { type: 'image', key: 'imageUrl', label: 'Ảnh chân dung' },
      { type: 'text', key: 'imageAlt', label: 'Mô tả ảnh (alt)', localized: true },
      { type: 'image', key: 'backgroundImageUrl', label: 'Ảnh nền' }
    ]
  },
  {
    key: 'visionMission',
    title: 'Vision / Mission / Values',
    description: 'Các thẻ giá trị; desktop xếp thành một hàng.',
    fields: [
      {
        type: 'list',
        key: 'items',
        label: 'Thẻ',
        itemLabel: 'Thẻ',
        titleKey: 'title',
        newItem: () => ({
          title: L(),
          description: L(),
          icon: 'vision',
          theme: 'blue',
          imageUrl: ''
        }),
        fields: [
          { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
          { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
          {
            type: 'select',
            key: 'icon',
            label: 'Icon mặc định',
            options: opts({
              vision: 'Con mắt (Vision)',
              mission: 'Mục tiêu (Mission)',
              values: 'Trái tim (Values)'
            })
          },
          {
            type: 'select',
            key: 'theme',
            label: 'Màu nhấn',
            options: opts({ blue: 'Xanh dương', purple: 'Tím', orange: 'Cam' })
          },
          {
            type: 'image',
            key: 'imageUrl',
            label: 'Icon ảnh (tuỳ chọn)',
            hint: 'Để trống để dùng icon mặc định bên trên.'
          }
        ]
      }
    ]
  },
  {
    key: 'offices',
    title: 'Offices',
    description: 'Trụ sở chính (kèm thông tin công ty) và các văn phòng khác.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề section', localized: true },
      {
        type: 'group',
        key: 'hq',
        label: 'Trụ sở chính',
        fields: [
          { type: 'text', key: 'name', label: 'Tên văn phòng', localized: true },
          { type: 'text', key: 'company', label: 'Tên công ty', localized: true },
          { type: 'image', key: 'imageUrl', label: 'Ảnh' },
          {
            type: 'list',
            key: 'facts',
            label: 'Thông tin',
            itemLabel: 'Dòng thông tin',
            titleKey: 'text',
            newItem: () => ({ icon: 'home', text: L(), muted: true }),
            fields: [
              {
                type: 'select',
                key: 'icon',
                label: 'Icon',
                options: opts({
                  home: 'Nhà (địa chỉ)',
                  building: 'Toà nhà',
                  calendar: 'Lịch (ngày thành lập)',
                  yen: 'Tiền (vốn)',
                  user: 'Người (đại diện)'
                })
              },
              { type: 'text', key: 'text', label: 'Nội dung', localized: true },
              { type: 'boolean', key: 'muted', label: 'Chữ màu nhạt (thông tin phụ)' }
            ]
          }
        ]
      },
      {
        type: 'list',
        key: 'branches',
        label: 'Văn phòng khác',
        itemLabel: 'Văn phòng',
        titleKey: 'name',
        hint: 'Desktop xếp các văn phòng thành cột bên phải trụ sở; đẹp nhất với 1–3 văn phòng.',
        newItem: () => ({ name: L(), imageUrl: '' }),
        fields: [
          { type: 'text', key: 'name', label: 'Tên văn phòng', localized: true },
          { type: 'image', key: 'imageUrl', label: 'Ảnh' }
        ]
      }
    ]
  },
  {
    key: 'team',
    title: 'Team',
    description: 'Tab lọc theo nhóm và danh sách thành viên.',
    fields: [
      { type: 'text', key: 'title', label: 'Tiêu đề section', localized: true },
      { type: 'text', key: 'allLabel', label: 'Nhãn tab "Tất cả"', localized: true },
      {
        type: 'list',
        key: 'categories',
        label: 'Nhóm (tab lọc)',
        itemLabel: 'Nhóm',
        titleKey: 'label',
        hint: 'Mã nhóm dùng để gán thành viên; đổi mã sẽ phải gán lại thành viên.',
        newItem: () => ({ id: '', label: L() }),
        fields: [
          { type: 'text', key: 'id', label: 'Mã nhóm (VD: management, engineer)' },
          { type: 'text', key: 'label', label: 'Tên hiển thị', localized: true }
        ]
      },
      {
        type: 'list',
        key: 'members',
        label: 'Thành viên',
        itemLabel: 'Thành viên',
        titleKey: 'name',
        newItem: () => ({ name: L(), role: L(), category: '', imageUrl: '' }),
        fields: [
          { type: 'text', key: 'name', label: 'Họ tên', localized: true },
          { type: 'text', key: 'role', label: 'Chức vụ', localized: true },
          {
            type: 'select',
            key: 'category',
            label: 'Nhóm',
            optionsFrom: { listKey: 'categories', valueKey: 'id', labelKey: 'label' },
            hint: 'Lấy từ danh sách "Nhóm" ở trên.'
          },
          { type: 'image', key: 'imageUrl', label: 'Ảnh (tỉ lệ dọc 3:4)' }
        ]
      }
    ]
  },
  {
    key: 'certifications',
    title: 'Certifications',
    description: 'Giới thiệu chứng nhận, ảnh minh hoạ và danh sách chứng nhận.',
    fields: [
      {
        type: 'text',
        key: 'eyebrow',
        label: 'Nhãn nhỏ phía trên (VD: Trust & Quality)',
        localized: true
      },
      { type: 'text', key: 'title', label: 'Tiêu đề', localized: true },
      { type: 'text', key: 'description', label: 'Mô tả', localized: true, multiline: true },
      { type: 'image', key: 'imageUrl', label: 'Ảnh minh hoạ (ẩn trên mobile)' },
      { type: 'text', key: 'imageAlt', label: 'Mô tả ảnh (alt)', localized: true },
      {
        type: 'list',
        key: 'items',
        label: 'Chứng nhận',
        itemLabel: 'Chứng nhận',
        titleKey: 'name',
        newItem: () => ({ name: L(), imageUrl: '' }),
        fields: [
          { type: 'text', key: 'name', label: 'Tên chứng nhận', localized: true },
          { type: 'image', key: 'imageUrl', label: 'Logo / ảnh' }
        ]
      }
    ]
  }
];
