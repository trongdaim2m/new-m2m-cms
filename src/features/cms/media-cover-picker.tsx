'use client';

import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

type MediaCoverPickerProps = {
  value?: string;
  previewUrl?: string | null;
  onChange: (mediaId: string | undefined, previewUrl?: string | null) => void;
  /** Fired after a library item is deleted on the server */
  onMediaDeleted?: (mediaId: string) => void;
};

function parseMediaList(json: { data?: unknown }) {
  const raw = json.data;
  if (Array.isArray(raw)) return raw as MediaItem[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: MediaItem[] }).data;
  }
  return [] as MediaItem[];
}

export function MediaCoverPicker({
  value,
  previewUrl,
  onChange,
  onMediaDeleted
}: MediaCoverPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setUploading(true);
    const toastId = toast.loading('Đang upload cover…');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/cms/media/upload', {
        method: 'POST',
        body
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Upload thất bại');
      }
      const media = json.data as MediaItem;
      onChange(media.id, media.url);
      await refresh();
      toast.success('Đã upload cover', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload thất bại', {
        id: toastId
      });
    } finally {
      setUploading(false);
    }
  }

  async function onDeleteItem(item: MediaItem) {
    setDeletingId(item.id);
    const toastId = toast.loading('Đang xóa ảnh…');
    try {
      const res = await fetch(`/api/cms/media/${item.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message || json?.message || 'Xóa thất bại');
      }
      if (value === item.id) {
        onChange(undefined, null);
      }
      onMediaDeleted?.(item.id);
      await refresh();
      toast.success('Đã xóa ảnh khỏi thư viện', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', {
        id: toastId
      });
    } finally {
      setDeletingId(null);
    }
  }

  function onRemoveCover() {
    onChange(undefined, null);
    toast.success('Đã bỏ cover — nhớ Save để lưu');
  }

  const busy = uploading || deletingId != null;

  return (
    <div className='relative space-y-2 rounded-md border border-border bg-card p-3 text-card-foreground'>
      {busy ? (
        <div className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]'>
          <div className='flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-sm'>
            <Spinner className='size-3.5' />
            {uploading ? 'Đang upload…' : 'Đang xóa…'}
          </div>
        </div>
      ) : null}

      <div className='flex items-center justify-between gap-3'>
        <span className='text-sm font-medium'>Cover image</span>
        <label
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 ${
            uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? <Spinner className='size-3.5' /> : null}
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type='file'
            accept='image/*'
            className='sr-only'
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void onUpload(file);
            }}
          />
        </label>
      </div>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt='' className='h-32 w-full rounded object-cover' />
      ) : (
        <div className='flex h-32 items-center justify-center rounded bg-muted text-xs text-muted-foreground'>
          No cover selected
        </div>
      )}

      {value ? (
        <button
          type='button'
          className='text-xs text-red-600 hover:underline disabled:opacity-50'
          disabled={busy}
          onClick={onRemoveCover}
        >
          Remove cover
        </button>
      ) : null}

      {loadingList ? (
        <div className='flex items-center gap-2 py-3 text-xs text-muted-foreground'>
          <Spinner className='size-3.5' />
          Đang tải danh sách ảnh…
        </div>
      ) : items.length > 0 ? (
        <div className='grid max-h-40 grid-cols-4 gap-2 overflow-auto'>
          {items
            .filter((item) => item.mimeType?.startsWith('image/'))
            .map((item) => (
              <div key={item.id} className='relative'>
                <button
                  type='button'
                  disabled={busy}
                  className={`w-full overflow-hidden rounded border ${
                    value === item.id ? 'border-[#22AAFF]' : 'border-transparent'
                  }`}
                  onClick={() => {
                    onChange(item.id, item.url);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.filename} className='h-16 w-full object-cover' />
                </button>
                <button
                  type='button'
                  title='Xóa ảnh khỏi thư viện'
                  disabled={busy}
                  className='absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded bg-black/70 text-[10px] leading-none text-white hover:bg-red-600 disabled:opacity-50'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void onDeleteItem(item);
                  }}
                >
                  {deletingId === item.id ? <Spinner className='size-3 text-white' /> : '×'}
                </button>
              </div>
            ))}
        </div>
      ) : (
        <p className='text-xs text-muted-foreground'>Chưa có ảnh trong thư viện.</p>
      )}
    </div>
  );
}
