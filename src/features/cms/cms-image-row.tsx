import { mergeAttributes, Node } from '@tiptap/core';

/**
 * Hàng ảnh: 1 ảnh = full width; 2+ = chia đều cùng hàng.
 * Layout thực tế do vị trí thả (ngang/dọc) quyết định — không còn “grid mode”.
 */
export const ImageRow = Node.create({
  name: 'imageRow',
  group: 'block',
  content: 'image{1,6}',
  defining: true,
  isolating: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="image-row"]' },
      { tag: 'div[data-type="image-grid"]' },
      { tag: 'div.cms-image-row' },
      { tag: 'div.cms-image-grid' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'image-row',
        class: 'cms-image-row'
      }),
      0
    ];
  }
});
