'use client';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

type MediaGalleryPickerProps = {
  value: string[];
  previews: string[];
  max?: number;
  onChange: (ids: string[], previews: string[]) => void;
};

function parseMediaList(json: { data?: unknown }) {
  const raw = json.data;
  if (Array.isArray(raw)) return raw as MediaItem[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: MediaItem[] }).data;
  }
  return [] as MediaItem[];
}

export function MediaGalleryPicker({
  value,
  previews,
  max = 2,
  onChange
}: MediaGalleryPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    try {
      const res = await fetch('/api/cms/media?pageSize=48');
      if (!res.ok) throw new Error('Không tải được danh sách ảnh');
      const json = await res.json();
      setItems(parseMediaList(json));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách ảnh');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(file: File) {
    if (value.length >= max) {
      toast.warning(`Tối đa ${max} ảnh gallery`);
      return;
    }
    setUploading(true);
    const toastId = toast.loading('Đang upload gallery…');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/cms/media/upload', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Upload thất bại');
      }
      const media = json.data as MediaItem;
      onChange([...value, media.id], [...previews, media.url]);
      await refresh();
      toast.success('Đã thêm ảnh gallery', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload thất bại', {
        id: toastId
      });
    } finally {
      setUploading(false);
    }
  }

  function toggle(item: MediaItem) {
    const idx = value.indexOf(item.id);
    if (idx >= 0) {
      onChange(
        value.filter((id) => id !== item.id),
        previews.filter((_, i) => i !== idx)
      );
      return;
    }
    if (value.length >= max) {
      toast.warning(`Tối đa ${max} ảnh gallery`);
      return;
    }
    onChange([...value, item.id], [...previews, item.url]);
  }

  return (
    <div className='relative space-y-3 rounded-md border border-border bg-card p-3 text-card-foreground'>
      {uploading ? (
        <div className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]'>
          <div className='flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-sm'>
            <Spinner className='size-3.5' />
            Đang upload…
          </div>
        </div>
      ) : null}

      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-sm font-medium'>
            Gallery ({value.length}/{max})
          </p>
          <p className='text-xs text-muted-foreground'>
            Khớp FE project detail: 2 ảnh cạnh nhau dưới body.
          </p>
        </div>
        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80',
            (uploading || value.length >= max) && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? <Spinner className='size-3.5' /> : null}
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type='file'
            accept='image/*'
            className='sr-only'
            disabled={uploading || value.length >= max}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void onUpload(file);
            }}
          />
        </label>
      </div>

      {previews.length > 0 ? (
        <div className='grid grid-cols-2 gap-2'>
          {previews.map((url, index) => (
            <div key={`${url}-${index}`} className='relative overflow-hidden rounded-lg'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt='' className='aspect-[840/480] w-full object-cover' />
              <button
                type='button'
                className='absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white'
                onClick={() => {
                  onChange(
                    value.filter((_, i) => i !== index),
                    previews.filter((_, i) => i !== index)
                  );
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex h-24 items-center justify-center rounded bg-muted text-xs text-muted-foreground'>
          Chưa chọn ảnh gallery
        </div>
      )}

      {loadingList ? (
        <div className='flex items-center gap-2 py-3 text-xs text-muted-foreground'>
          <Spinner className='size-3.5' />
          Đang tải danh sách ảnh…
        </div>
      ) : (
        <div className='grid max-h-40 grid-cols-4 gap-2 overflow-auto'>
          {items
            .filter((item) => item.mimeType?.startsWith('image/'))
            .map((item) => (
              <button
                key={item.id}
                type='button'
                disabled={uploading}
                className={cn(
                  'overflow-hidden rounded border',
                  value.includes(item.id) ? 'border-[#22AAFF]' : 'border-transparent'
                )}
                onClick={() => toggle(item)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.filename} className='h-16 w-full object-cover' />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
