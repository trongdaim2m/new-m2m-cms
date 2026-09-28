'use client';

import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';

import { deleteImageAndCleanup } from '@/features/cms/cms-image-layout';
import { cn } from '@/lib/utils';

function clampWidth(value: number) {
  return Math.min(100, Math.max(15, Math.round(value)));
}

function clampPad(value: number) {
  return Math.min(80, Math.max(0, Math.round(value)));
}

function CmsImageView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const widthPct = clampWidth(Number(node.attrs.width ?? 100));
  const padT = clampPad(Number(node.attrs.paddingTop ?? 0));
  const padR = clampPad(Number(node.attrs.paddingRight ?? 0));
  const padB = clampPad(Number(node.attrs.paddingBottom ?? 0));
  const padL = clampPad(Number(node.attrs.paddingLeft ?? 0));
  const [editorWidth, setEditorWidth] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [inMultiRow, setInMultiRow] = useState(false);

  useEffect(() => {
    if (!editor || typeof getPos !== 'function') {
      setInMultiRow(false);
      return;
    }
    try {
      const p = getPos();
      if (typeof p !== 'number') {
        setInMultiRow(false);
        return;
      }
      const $pos = editor.state.doc.resolve(p + 1);
      setInMultiRow($pos.parent.type.name === 'imageRow' && $pos.parent.childCount > 1);
    } catch {
      setInMultiRow(false);
    }
  }, [editor, getPos, node]);

  useEffect(() => {
    const dom = editor?.view?.dom as HTMLElement | undefined;
    if (!dom) return;
    const measure = () => setEditorWidth(dom.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(dom);
    return () => ro.disconnect();
  }, [editor]);

  useEffect(() => {
    setLoadError(false);
  }, [node.attrs.src]);

  const pixelWidth =
    !inMultiRow && editorWidth > 0
      ? Math.max(80, Math.round((editorWidth * widthPct) / 100))
      : undefined;

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLSpanElement>) => {
      if (inMultiRow) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startPct = widthPct;
      const basis = editorWidth || editor?.view?.dom?.clientWidth || 1;

      const onMove = (moveEvent: PointerEvent) => {
        const deltaPct = ((moveEvent.clientX - startX) / basis) * 100;
        updateAttributes({ width: clampWidth(startPct + deltaPct) });
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [editor, editorWidth, inMultiRow, updateAttributes, widthPct]
  );

  const onDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const pos = typeof getPos === 'function' ? getPos() : null;
      if (typeof pos !== 'number') {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/x-cms-image-pos', String(pos));
      event.dataTransfer.setData('application/x-cms-image-id', String(node.attrs.mediaId || ''));
      event.dataTransfer.setData('application/x-cms-image-src', String(node.attrs.src || ''));
      event.dataTransfer.setData('text/plain', `cms-image:${pos}`);
    },
    [getPos, node.attrs.mediaId, node.attrs.src]
  );

  const removeImage = useCallback(() => {
    if (!editor || typeof getPos !== 'function') return;
    const pos = getPos();
    if (typeof pos !== 'number') return;
    const mediaId = String(node.attrs.mediaId || '');
    const cleanup = deleteImageAndCleanup(editor, pos);
    if (cleanup) editor.view.dispatch(cleanup.tr.scrollIntoView());
    // Defer server delete until form save — only queue pending list here
    if (mediaId) {
      const onRemoved = (
        editor.storage as { image?: { onMediaRemoved?: ((id: string) => void) | null } }
      ).image?.onMediaRemoved;
      onRemoved?.(mediaId);
    }
  }, [editor, getPos, node.attrs.mediaId]);

  const src = String(node.attrs.src || '');
  const srcInvalid =
    !src || (!/^https?:\/\//i.test(src) && !src.startsWith('/') && !src.startsWith('blob:'));
  const broken = srcInvalid || loadError;

  return (
    <NodeViewWrapper
      as='div'
      className={cn(
        'cms-resizable-image group relative block max-w-full',
        !inMultiRow && widthPct < 100 && 'mx-auto',
        selected && 'is-selected ring-2 ring-[#22AAFF] ring-offset-2'
      )}
      data-width={widthPct}
      data-media-id={node.attrs.mediaId || undefined}
      style={{
        width: inMultiRow ? '100%' : pixelWidth ? `${pixelWidth}px` : `${widthPct}%`,
        maxWidth: '100%',
        paddingTop: padT,
        paddingRight: padR,
        paddingBottom: padB,
        paddingLeft: padL,
        boxSizing: 'border-box'
      }}
    >
      <div
        className={cn(
          'absolute right-2 top-2 z-10 flex items-center gap-1',
          'opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100',
          (selected || broken) && 'sm:opacity-100'
        )}
        contentEditable={false}
      >
        <button
          type='button'
          title='Xóa ảnh'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeImage();
          }}
          className='inline-flex size-7 items-center justify-center rounded-md border border-white/30 bg-red-600 text-white shadow backdrop-blur hover:bg-red-500'
        >
          <IconTrash className='size-3.5' />
        </button>
      </div>

      <div
        draggable
        onDragStart={onDragStart}
        className={cn(
          'absolute left-2 top-2 z-10 inline-flex size-7 cursor-grab items-center justify-center rounded-md',
          'border border-white/30 bg-black/55 text-white shadow backdrop-blur',
          'opacity-100 transition active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100',
          selected && 'sm:opacity-100'
        )}
        title='Kéo: ngang = cùng hàng · dọc = hàng mới'
        contentEditable={false}
      >
        <IconGripVertical className='pointer-events-none size-4' />
      </div>

      {broken ? (
        <div className='flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-destructive/50 bg-destructive/5 px-3 py-6 text-center text-xs text-destructive'>
          <span>Ảnh lỗi — src không hợp lệ hoặc không tải được.</span>
          <button
            type='button'
            className='rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-white'
            onClick={removeImage}
          >
            Xóa ảnh này
          </button>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={(node.attrs.alt as string) || ''}
          className='block h-auto w-full rounded-xl object-cover'
          draggable={false}
          onError={() => setLoadError(true)}
        />
      )}

      {selected && !inMultiRow && !broken ? (
        <>
          <div className='absolute bottom-2 left-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white'>
            {widthPct}%
          </div>
          <span
            role='presentation'
            data-resize-handle
            onPointerDown={onResizePointerDown}
            className='absolute bottom-1.5 right-1.5 z-10 size-4 cursor-se-resize rounded-sm border-2 border-white bg-[#22AAFF] shadow'
            title='Kéo để resize'
          />
        </>
      ) : null}

      {selected && !broken ? (
        <div
          contentEditable={false}
          className='absolute -bottom-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-popover px-1.5 py-1 text-[10px] text-popover-foreground shadow-lg'
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className='text-muted-foreground'>pad</span>
          {(
            [
              ['T', 'paddingTop', padT],
              ['R', 'paddingRight', padR],
              ['B', 'paddingBottom', padB],
              ['L', 'paddingLeft', padL]
            ] as const
          ).map(([label, key, val]) => (
            <label key={key} className='flex items-center gap-0.5'>
              <span className='text-muted-foreground'>{label}</span>
              <input
                type='number'
                min={0}
                max={80}
                step={4}
                value={val}
                className='h-6 w-10 rounded border border-border bg-background px-1 text-[10px]'
                onChange={(e) => updateAttributes({ [key]: clampPad(Number(e.target.value) || 0) })}
              />
            </label>
          ))}
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

function parsePad(el: HTMLElement, side: string) {
  const data = el.getAttribute(`data-pad-${side}`);
  if (data) return clampPad(Number(data));
  const style = el.style;
  const map: Record<string, string> = {
    top: style.paddingTop,
    right: style.paddingRight,
    bottom: style.paddingBottom,
    left: style.paddingLeft
  };
  const raw = map[side];
  if (raw?.endsWith('px')) return clampPad(Number(raw.replace('px', '')));
  return 0;
}

declare module '@tiptap/core' {
  interface Storage {
    image: { onMediaRemoved: null | ((mediaId: string) => void) };
  }
}

export const ResizableImage = Image.extend({
  name: 'image',
  // Native PM drag breaks imageRow; reposition only via grip + HTML5 DnD.
  draggable: false,
  selectable: true,
  addStorage() {
    return {
      onMediaRemoved: null as null | ((mediaId: string) => void)
    };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-media-id') || '',
        renderHTML: () => ({})
      },
      width: {
        default: 100,
        parseHTML: (element) => {
          const data = element.getAttribute('data-width');
          if (data) return clampWidth(Number(data));
          const w = element.style?.width;
          if (w?.endsWith('%')) return clampWidth(Number(w.replace('%', '')));
          return 100;
        },
        renderHTML: () => ({})
      },
      paddingTop: {
        default: 0,
        parseHTML: (el) => parsePad(el as HTMLElement, 'top'),
        renderHTML: () => ({})
      },
      paddingRight: {
        default: 0,
        parseHTML: (el) => parsePad(el as HTMLElement, 'right'),
        renderHTML: () => ({})
      },
      paddingBottom: {
        default: 0,
        parseHTML: (el) => parsePad(el as HTMLElement, 'bottom'),
        renderHTML: () => ({})
      },
      paddingLeft: {
        default: 0,
        parseHTML: (el) => parsePad(el as HTMLElement, 'left'),
        renderHTML: () => ({})
      }
    };
  },
  renderHTML({ HTMLAttributes, node }) {
    const w = clampWidth(Number(node.attrs.width ?? 100));
    const pt = clampPad(Number(node.attrs.paddingTop ?? 0));
    const pr = clampPad(Number(node.attrs.paddingRight ?? 0));
    const pb = clampPad(Number(node.attrs.paddingBottom ?? 0));
    const pl = clampPad(Number(node.attrs.paddingLeft ?? 0));
    const mediaId = String(node.attrs.mediaId || '');
    const styleParts = [
      `width: ${w}%;`,
      'height: auto;',
      'max-width: 100%;',
      w < 100 ? 'display: block; margin-left: auto; margin-right: auto;' : '',
      pt ? `padding-top: ${pt}px;` : '',
      pr ? `padding-right: ${pr}px;` : '',
      pb ? `padding-bottom: ${pb}px;` : '',
      pl ? `padding-left: ${pl}px;` : ''
    ].filter(Boolean);

    return [
      'img',
      {
        ...HTMLAttributes,
        src: node.attrs.src,
        alt: node.attrs.alt || '',
        'data-width': String(w),
        ...(mediaId ? { 'data-media-id': mediaId } : {}),
        ...(pt ? { 'data-pad-top': String(pt) } : {}),
        ...(pr ? { 'data-pad-right': String(pr) } : {}),
        ...(pb ? { 'data-pad-bottom': String(pb) } : {}),
        ...(pl ? { 'data-pad-left': String(pl) } : {}),
        style: styleParts.join(' ')
      }
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CmsImageView, {
      className: 'cms-image-node',
      stopEvent: ({ event }) => {
        const t = event.type;
        if (t === 'dragstart' || t === 'drag' || t === 'dragend') {
          const target = event.target as HTMLElement | null;
          return Boolean(target?.closest('[draggable="true"]'));
        }
        if (t === 'pointerdown' || t === 'mousedown' || t === 'touchstart' || t === 'click') {
          const target = event.target as HTMLElement | null;
          if (target?.closest('[data-resize-handle], [draggable="true"], input, button')) {
            return true;
          }
        }
        return false;
      }
    });
  }
});
