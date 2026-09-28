'use client';

import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconCalendarEvent,
  IconClearFormatting,
  IconCode,
  IconH2,
  IconH3,
  IconHighlight,
  IconItalic,
  IconLayoutCards,
  IconLink,
  IconList,
  IconListNumbers,
  IconPhoto,
  IconQuote,
  IconSeparator,
  IconStrikethrough,
  IconUnderline
} from '@tabler/icons-react';
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';

import {
  findImageHit,
  findImagePosByIdentity,
  isHorizontalEdge,
  isSparseDoc,
  makeImageNode,
  moveImageToHit,
  placeImages,
  resolveBlockPos,
  type DropEdge,
  type ImageHit
} from '@/features/cms/cms-image-layout';
import { ImageRow } from '@/features/cms/cms-image-row';
import { ResizableImage } from '@/features/cms/cms-resizable-image';
import { cn } from '@/lib/utils';

type CmsRichTextEditorProps = {
  value: string;
  /** Prefer JSON round-trip — avoids HTML parse dropping image rows */
  valueJson?: Record<string, unknown> | null;
  onChange: (html: string, json: Record<string, unknown>) => void;
  placeholder?: string;
  minHeightClassName?: string;
  variant?: 'news' | 'project' | 'career' | 'default';
  /** Queued for server delete only after parent form saves */
  onMediaRemoved?: (mediaId: string) => void;
};

const CMS_IMAGE_POS = 'application/x-cms-image-pos';
const CMS_IMAGE_ID = 'application/x-cms-image-id';
const CMS_IMAGE_SRC = 'application/x-cms-image-src';
const MAX_UPLOAD = 6;
const WIDTH_PRESETS = [25, 50, 75, 100] as const;

async function uploadFile(file: File): Promise<{ id: string; url: string } | null> {
  const body = new FormData();
  body.append('file', file);
  try {
    const res = await fetch('/api/cms/media/upload', { method: 'POST', body });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      console.error('Upload failed', res.status, json);
      return null;
    }
    const media = (json?.data ?? json) as { id?: string; url?: string } | null;
    const url = media?.url;
    const id = media?.id;
    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      console.error('Upload missing valid url', json);
      return null;
    }
    return { id: id || '', url };
  } catch (err) {
    console.error('Upload error', err);
    return null;
  }
}

function imageFilesFromList(list: FileList | File[] | null | undefined) {
  return Array.from(list || []).filter((f) => f.type.startsWith('image/'));
}

type InsertFn = (files: File[], hit: ImageHit | null, fallbackPos: number) => Promise<boolean>;

export function CmsRichTextEditor({
  value,
  valueJson,
  onChange,
  placeholder = 'Bắt đầu viết nội dung…',
  minHeightClassName = 'min-h-[280px]',
  variant = 'default',
  onMediaRemoved
}: CmsRichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [dropHint, setDropHint] = useState<{
    edge: DropEdge;
    rect: DOMRect;
  } | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const insertFilesRef = useRef<InsertFn>(async () => false);
  const onMediaRemovedRef = useRef(onMediaRemoved);
  const onChangeRef = useRef(onChange);
  const lastEmittedHtmlRef = useRef(value || '<p></p>');
  const lastEmittedJsonRef = useRef<string>(
    JSON.stringify(valueJson || { type: 'doc', content: [{ type: 'paragraph' }] })
  );
  const applyingExternalRef = useRef(false);
  const dropHandledRef = useRef(false);
  onMediaRemovedRef.current = onMediaRemoved;
  onChangeRef.current = onChange;

  const initialContent =
    valueJson && typeof valueJson === 'object' && !isSparseDoc(valueJson)
      ? valueJson
      : value || '<p></p>';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-[#22AAFF] underline underline-offset-2'
        }
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: false
      }),
      ImageRow,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({ multicolor: false }),
      Typography,
      CharacterCount
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'cms-editor prose prose-sm dark:prose-invert max-w-none px-5 py-4 focus:outline-none',
          'prose-headings:font-semibold prose-a:text-[#22AAFF]',
          'prose-img:rounded-xl prose-blockquote:border-[#22AAFF]',
          minHeightClassName
        )
      },
      handleDrop: (_view, event, _slice, moved) => {
        // Ignore ProseMirror internal node drags — they break imageRow.
        if (moved) {
          event.preventDefault();
          return true;
        }

        const files = imageFilesFromList(event.dataTransfer?.files);
        const types = Array.from(event.dataTransfer?.types || []);
        const hasMove =
          types.includes(CMS_IMAGE_POS) ||
          types.includes(CMS_IMAGE_ID) ||
          types.includes(CMS_IMAGE_SRC);

        if (!files.length && !hasMove) return false;

        event.preventDefault();
        event.stopPropagation();
        dropHandledRef.current = true;

        const ed = editorRef.current;
        if (!ed) return true;

        const hit = findImageHit(ed, event.clientX, event.clientY);
        const fallbackPos = resolveBlockPos(ed, event.clientX, event.clientY);

        if (files.length) {
          void insertFilesRef.current(files, hit, fallbackPos);
          return true;
        }

        const fromPosRaw = event.dataTransfer?.getData(CMS_IMAGE_POS);
        const mediaId = event.dataTransfer?.getData(CMS_IMAGE_ID) || '';
        const src = event.dataTransfer?.getData(CMS_IMAGE_SRC) || '';
        const roughPos = Number(fromPosRaw);
        const fromPos = findImagePosByIdentity(ed, {
          mediaId: mediaId || undefined,
          src: src || undefined,
          fromPos: Number.isFinite(roughPos) ? roughPos : undefined
        });
        if (fromPos != null) moveImageToHit(ed, fromPos, hit, fallbackPos);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = imageFilesFromList(event.clipboardData?.files);
        if (!files.length) return false;
        event.preventDefault();
        void insertFilesRef.current(files, null, editorRef.current?.state.selection.to ?? 0);
        return true;
      }
    },
    onUpdate: ({ editor: current }) => {
      if (applyingExternalRef.current) return;
      const html = current.getHTML();
      const json = current.getJSON() as Record<string, unknown>;
      lastEmittedHtmlRef.current = html;
      lastEmittedJsonRef.current = JSON.stringify(json);
      queueMicrotask(() => {
        onChangeRef.current(html, json);
      });
    }
  });

  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    editor.storage.image.onMediaRemoved = (mediaId: string) => {
      onMediaRemovedRef.current?.(mediaId);
    };
    return () => {
      editor.storage.image.onMediaRemoved = null;
    };
  }, [editor]);

  useEffect(() => {
    insertFilesRef.current = async (files, hit, fallbackPos) => {
      const ed = editorRef.current;
      if (!ed || !files.length) return false;
      setUploading(true);
      try {
        const uploaded = (
          await Promise.all(
            files.slice(0, MAX_UPLOAD).map(async (file) => {
              const media = await uploadFile(file);
              return media
                ? {
                    src: media.url,
                    mediaId: media.id,
                    alt: file.name.replace(/\.[^.]+$/, '')
                  }
                : null;
            })
          )
        ).filter(Boolean) as { src: string; mediaId: string; alt: string }[];

        if (!uploaded.length) {
          window.alert('Upload ảnh thất bại. Thử lại hoặc dùng nút Ảnh trên toolbar.');
          return false;
        }

        if (!hit || !isHorizontalEdge(hit.edge)) {
          let nextHit = hit;
          let nextPos = fallbackPos;
          for (let i = 0; i < uploaded.length; i++) {
            placeImages(ed, [makeImageNode(ed, uploaded[i])], {
              hit: i === 0 ? nextHit : null,
              fallbackPos: nextPos
            });
            nextHit = null;
            nextPos = ed.state.doc.content.size;
          }
          return true;
        }

        const nodes = uploaded.map((item) => makeImageNode(ed, item));
        return placeImages(ed, nodes, { hit, fallbackPos });
      } catch (err) {
        console.error('CMS image insert failed', err);
        window.alert('Không chèn được ảnh vào editor.');
        return false;
      } finally {
        setUploading(false);
        setDropHint(null);
      }
    };
  }, []);

  // External content only (load article) — prefer JSON to keep imageRow intact.
  // Sparse/empty valueJson must NOT wipe HTML that still has images.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const preferJson = valueJson && typeof valueJson === 'object' && !isSparseDoc(valueJson);

    if (preferJson) {
      const incoming = JSON.stringify(valueJson);
      if (incoming === lastEmittedJsonRef.current) return;
      applyingExternalRef.current = true;
      queueMicrotask(() => {
        if (editor.isDestroyed) return;
        editor.commands.setContent(valueJson, { emitUpdate: false });
        lastEmittedJsonRef.current = incoming;
        lastEmittedHtmlRef.current = editor.getHTML();
        applyingExternalRef.current = false;
      });
      return;
    }

    const next = value || '<p></p>';
    if (next === lastEmittedHtmlRef.current) return;
    applyingExternalRef.current = true;
    queueMicrotask(() => {
      if (editor.isDestroyed) return;
      editor.commands.setContent(next, { emitUpdate: false });
      lastEmittedHtmlRef.current = next;
      lastEmittedJsonRef.current = JSON.stringify(editor.getJSON());
      applyingExternalRef.current = false;
    });
  }, [editor, value, valueJson]);

  function updateDropContext(event: DragEvent<HTMLDivElement>) {
    const ed = editorRef.current;
    if (!ed) return;
    const hit = findImageHit(ed, event.clientX, event.clientY);
    queueMicrotask(() => {
      if (hit) {
        setDropHint({ edge: hit.edge, rect: hit.rect });
      } else {
        setDropHint(null);
      }
    });
  }

  function onShellDragOver(event: DragEvent<HTMLDivElement>) {
    const types = Array.from(event.dataTransfer?.types || []);
    const hasFiles = types.includes('Files');
    const hasMove =
      types.includes(CMS_IMAGE_POS) ||
      types.includes(CMS_IMAGE_ID) ||
      types.includes(CMS_IMAGE_SRC);
    if (!hasFiles && !hasMove) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = hasMove ? 'move' : 'copy';
    updateDropContext(event);
  }

  function onShellDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDropHint(null);
    }
  }

  function onShellDrop(event: DragEvent<HTMLDivElement>) {
    // ProseMirror handleDrop already processed this event
    if (dropHandledRef.current) {
      dropHandledRef.current = false;
      setDropHint(null);
      return;
    }

    const files = imageFilesFromList(event.dataTransfer.files);
    const fromRaw = event.dataTransfer.getData(CMS_IMAGE_POS);
    const mediaId = event.dataTransfer.getData(CMS_IMAGE_ID) || '';
    const src = event.dataTransfer.getData(CMS_IMAGE_SRC) || '';
    if (!files.length && !fromRaw && !mediaId && !src) return;

    event.preventDefault();
    event.stopPropagation();
    setDropHint(null);

    const ed = editorRef.current;
    if (!ed) return;

    const hit = findImageHit(ed, event.clientX, event.clientY);
    const fallbackPos = resolveBlockPos(ed, event.clientX, event.clientY);

    if (fromRaw || mediaId || src) {
      const roughPos = Number(fromRaw);
      const fromPos = findImagePosByIdentity(ed, {
        mediaId: mediaId || undefined,
        src: src || undefined,
        fromPos: Number.isFinite(roughPos) ? roughPos : undefined
      });
      if (fromPos != null) moveImageToHit(ed, fromPos, hit, fallbackPos);
      return;
    }
    void insertFilesRef.current(files, hit, fallbackPos);
  }

  async function uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = imageFilesFromList(input.files);
      if (!files.length) return;
      const ed = editorRef.current;
      await insertFilesRef.current(files, null, ed?.state.selection.to ?? 0);
    };
    input.click();
  }

  function setImageWidth(pct: number) {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { width: pct }).run();
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL liên kết', prev || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  if (!editor) {
    return (
      <div className='flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground'>
        Đang tải editor…
      </div>
    );
  }

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;
  const imageActive = editor.isActive('image');
  const currentWidth = Number(editor.getAttributes('image').width ?? 100);

  const hintStyle = dropHint
    ? (() => {
        const { rect, edge } = dropHint;
        const thickness = 4;
        if (edge === 'left') {
          return {
            left: rect.left,
            top: rect.top,
            width: thickness,
            height: rect.height
          };
        }
        if (edge === 'right') {
          return {
            left: rect.right - thickness,
            top: rect.top,
            width: thickness,
            height: rect.height
          };
        }
        if (edge === 'top') {
          return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: thickness
          };
        }
        return {
          left: rect.left,
          top: rect.bottom - thickness,
          width: rect.width,
          height: thickness
        };
      })()
    : null;

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10'>
      <div className='sticky top-0 z-10 border-b border-border bg-gradient-to-b from-muted/80 to-muted/40 px-2 py-2 backdrop-blur'>
        <div className='flex flex-wrap items-center gap-1'>
          <ToolGroup>
            <IconBtn
              title='Undo'
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <IconArrowBackUp className='size-4' />
            </IconBtn>
            <IconBtn
              title='Redo'
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <IconArrowForwardUp className='size-4' />
            </IconBtn>
          </ToolGroup>

          <Sep />

          <ToolGroup>
            <IconBtn
              title='Heading 2'
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <IconH2 className='size-4' />
            </IconBtn>
            <IconBtn
              title='Heading 3'
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <IconH3 className='size-4' />
            </IconBtn>
          </ToolGroup>

          <Sep />

          <ToolGroup>
            <IconBtn
              title='Bold'
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <IconBold className='size-4' />
            </IconBtn>
            <IconBtn
              title='Italic'
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <IconItalic className='size-4' />
            </IconBtn>
            <IconBtn
              title='Underline'
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <IconUnderline className='size-4' />
            </IconBtn>
            <IconBtn
              title='Strikethrough'
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <IconStrikethrough className='size-4' />
            </IconBtn>
            <IconBtn
              title='Highlight'
              active={editor.isActive('highlight')}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <IconHighlight className='size-4' />
            </IconBtn>
            <IconBtn
              title='Inline code'
              active={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <IconCode className='size-4' />
            </IconBtn>
          </ToolGroup>

          <Sep />

          <ToolGroup>
            <IconBtn
              title='Bullet list'
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <IconList className='size-4' />
            </IconBtn>
            <IconBtn
              title='Ordered list'
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <IconListNumbers className='size-4' />
            </IconBtn>
            <IconBtn
              title='Quote'
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <IconQuote className='size-4' />
            </IconBtn>
            <IconBtn
              title='Divider'
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <IconSeparator className='size-4' />
            </IconBtn>
          </ToolGroup>

          <Sep />

          <ToolGroup>
            <IconBtn
              title='Align left'
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <IconAlignLeft className='size-4' />
            </IconBtn>
            <IconBtn
              title='Align center'
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <IconAlignCenter className='size-4' />
            </IconBtn>
            <IconBtn
              title='Align right'
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <IconAlignRight className='size-4' />
            </IconBtn>
          </ToolGroup>

          <Sep />

          <ToolGroup>
            <IconBtn title='Link' active={editor.isActive('link')} onClick={setLink}>
              <IconLink className='size-4' />
            </IconBtn>
            <IconBtn
              title='Thêm ảnh — thả ngang = cùng hàng · thả dọc = hàng mới'
              onClick={() => void uploadImage()}
              disabled={uploading}
            >
              <IconPhoto className='size-4' />
            </IconBtn>
            <IconBtn
              title='Clear formatting'
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            >
              <IconClearFormatting className='size-4' />
            </IconBtn>
          </ToolGroup>

          {imageActive && (
            <>
              <Sep />
              <ToolGroup>
                {WIDTH_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type='button'
                    title={`Width ${pct}%`}
                    onClick={() => setImageWidth(pct)}
                    className={cn(
                      'h-8 min-w-8 rounded-lg px-1.5 text-[11px] font-semibold transition',
                      currentWidth === pct
                        ? 'bg-[#22AAFF] text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </ToolGroup>
            </>
          )}

          {(variant === 'news' || variant === 'project' || variant === 'career') && (
            <>
              <Sep />
              <ToolGroup>
                {(variant === 'news' || variant === 'project') && (
                  <IconBtn
                    title='Chèn Feature block (H3 + đoạn)'
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .insertContent([
                          {
                            type: 'heading',
                            attrs: { level: 3 },
                            content: [{ type: 'text', text: 'Feature title' }]
                          },
                          {
                            type: 'paragraph',
                            content: [
                              {
                                type: 'text',
                                text: 'Feature description…'
                              }
                            ]
                          }
                        ])
                        .run()
                    }
                  >
                    <IconLayoutCards className='size-4' />
                  </IconBtn>
                )}
                {variant === 'news' && (
                  <IconBtn
                    title='Chèn Event info (H3 + list)'
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .insertContent([
                          {
                            type: 'heading',
                            attrs: { level: 3 },
                            content: [{ type: 'text', text: 'Event Information' }]
                          },
                          {
                            type: 'bulletList',
                            content: ['Date: …', 'Venue: …', 'Address: …', 'Booth: …'].map(
                              (text) => ({
                                type: 'listItem',
                                content: [
                                  {
                                    type: 'paragraph',
                                    content: [{ type: 'text', text }]
                                  }
                                ]
                              })
                            )
                          }
                        ])
                        .run()
                    }
                  >
                    <IconCalendarEvent className='size-4' />
                  </IconBtn>
                )}
                {variant === 'career' && (
                  <IconBtn
                    title='Chèn bullet list'
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .insertContent({
                          type: 'bulletList',
                          content: [
                            'Trách nhiệm / quyền lợi 1',
                            'Trách nhiệm / quyền lợi 2',
                            'Trách nhiệm / quyền lợi 3'
                          ].map((text) => ({
                            type: 'listItem',
                            content: [
                              {
                                type: 'paragraph',
                                content: [{ type: 'text', text }]
                              }
                            ]
                          }))
                        })
                        .run()
                    }
                  >
                    <IconList className='size-4' />
                  </IconBtn>
                )}
              </ToolGroup>
            </>
          )}
        </div>
      </div>

      <BubbleMenu
        editor={editor}
        options={{ placement: 'top', offset: 8 }}
        shouldShow={({ editor: ed, state }) => {
          if (ed.isActive('image') || ed.isActive('imageRow')) return false;
          return !state.selection.empty;
        }}
        className='z-50 flex items-center gap-0.5 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl'
      >
        <IconBtn
          title='Bold'
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold className='size-3.5' />
        </IconBtn>
        <IconBtn
          title='Italic'
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic className='size-3.5' />
        </IconBtn>
        <IconBtn
          title='Underline'
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <IconUnderline className='size-3.5' />
        </IconBtn>
        <IconBtn
          title='Highlight'
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <IconHighlight className='size-3.5' />
        </IconBtn>
        <IconBtn title='Link' active={editor.isActive('link')} onClick={setLink}>
          <IconLink className='size-3.5' />
        </IconBtn>
      </BubbleMenu>

      <div
        className='relative'
        onDragOver={onShellDragOver}
        onDragLeave={onShellDragLeave}
        onDrop={onShellDrop}
      >
        <EditorContent editor={editor} />
        {hintStyle ? (
          <div
            className='pointer-events-none fixed z-40 rounded-full bg-[#22AAFF] shadow-[0_0_0_2px_rgba(34,170,255,0.35)]'
            style={hintStyle}
          />
        ) : null}
        {uploading ? (
          <div className='absolute inset-x-0 bottom-3 z-30 mx-auto w-fit rounded-full bg-[#22AAFF] px-3 py-1 text-xs font-medium text-white shadow-lg'>
            Đang upload ảnh…
          </div>
        ) : null}
      </div>

      <div className='flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground'>
        <span>Resize + căn giữa · ngang = chia hàng full · pad T/R/B/L khi chọn ảnh</span>
        <span>
          {words} words · {chars} chars
        </span>
      </div>
    </div>
  );
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className='flex items-center gap-0.5'>{children}</div>;
}

function Sep() {
  return <div className='mx-1 hidden h-5 w-px bg-border sm:block' aria-hidden />;
}

function IconBtn({
  children,
  active,
  disabled,
  title,
  onClick
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg transition',
        active
          ? 'bg-[#22AAFF] text-white shadow-sm'
          : 'text-muted-foreground hover:bg-background hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {children}
    </button>
  );
}

export type CmsEditor = Editor;
