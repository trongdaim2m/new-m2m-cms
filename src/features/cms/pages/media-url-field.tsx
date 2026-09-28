'use client';

import { Spinner } from '@/components/ui/spinner';
import { useState } from 'react';
import { toast } from 'sonner';

type MediaItem = { id: string; url: string; filename: string; mimeType: string };

function parseMediaList(json: { data?: unknown }): MediaItem[] {
  const raw = json.data;
  if (Array.isArray(raw)) return raw as MediaItem[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: MediaItem[] }).data;
  }
  return [];
}

type MediaUrlFieldProps = {
  value: string;
  onChange: (url: string) => void;
};

export function MediaUrlField({ value, onChange }: MediaUrlFieldProps) {
  const [library, setLibrary] = useState<MediaItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleLibrary() {
    const next = !open;
    setOpen(next);
    if (next && library === null) {
      try {
        const res = await fetch('/api/cms/media?pageSize=48');
        const json = await res.json();
        setLibrary(parseMediaList(json).filter((m) => m.mimeType?.startsWith('image/')));
      } catch {
        toast.error('Không tải được Media library');
        setLibrary([]);
      }
    }
  }

  async function onUpload(file: File) {
    setBusy(true);
    const toastId = toast.loading('Đang upload ảnh…');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/cms/media/upload', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Upload thất bại');
      }
      const media = json.data as MediaItem;
      onChange(media.url);
      setLibrary((prev) => (prev ? [media, ...prev] : prev));
      toast.success('Đã upload — nhớ bấm Lưu', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload thất bại', { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-start gap-3'>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=''
            className='size-16 shrink-0 rounded border border-border bg-muted object-contain'
          />
        ) : (
          <div className='flex size-16 shrink-0 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground'>
            Chưa có
          </div>
        )}
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <input
            className='w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm'
            value={value}
            placeholder='https://… hoặc /uploads/…'
            onChange={(e) => onChange(e.target.value)}
          />
          <div className='flex flex-wrap gap-2 text-xs'>
            <label
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#22AAFF] px-3 py-1.5 font-medium text-white hover:bg-[#0B6EAB] ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {busy ? <Spinner className='size-3.5 text-white' /> : null}
              Upload
              <input
                type='file'
                accept='image/*'
                className='sr-only'
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void onUpload(file);
                }}
              />
            </label>
            <button
              type='button'
              className='rounded-md bg-muted px-3 py-1.5 font-medium hover:bg-muted/80'
              onClick={() => void toggleLibrary()}
            >
              {open ? 'Đóng thư viện' : 'Chọn từ thư viện'}
            </button>
            {value ? (
              <button
                type='button'
                className='px-2 py-1.5 text-red-600 hover:underline'
                onClick={() => onChange('')}
              >
                Bỏ ảnh
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {open ? (
        library === null ? (
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Spinner className='size-3.5' />
            Đang tải…
          </div>
        ) : library.length === 0 ? (
          <p className='text-xs text-muted-foreground'>Thư viện trống.</p>
        ) : (
          <div className='grid max-h-40 grid-cols-6 gap-2 overflow-auto rounded-md border border-border p-2 sm:grid-cols-8'>
            {library.map((media) => (
              <button
                key={media.id}
                type='button'
                title={media.filename}
                className={`overflow-hidden rounded border ${
                  value === media.url
                    ? 'border-[#22AAFF]'
                    : 'border-transparent hover:border-[#22AAFF]/60'
                }`}
                onClick={() => {
                  onChange(media.url);
                  setOpen(false);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt={media.filename}
                  className='aspect-square w-full object-cover'
                />
              </button>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
