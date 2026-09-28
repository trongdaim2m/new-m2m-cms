'use client';

import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function parseMediaList(json: { data?: unknown }) {
  const raw = json.data;
  if (Array.isArray(raw)) return raw as MediaItem[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: MediaItem[] }).data;
  }
  return [] as MediaItem[];
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch('/api/cms/media?pageSize=50');
      if (!res.ok) throw new Error('Không tải được media');
      const json = await res.json();
      setItems(parseMediaList(json));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được media');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(file: File) {
    setUploading(true);
    const toastId = toast.loading('Đang upload…');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/cms/media/upload', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Upload thất bại');
      }
      await refresh();
      toast.success('Upload thành công', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload thất bại', {
        id: toastId
      });
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    const toastId = toast.loading('Đang xóa…');
    try {
      const res = await fetch(`/api/cms/media/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message || json?.message || 'Xóa thất bại');
      }
      await refresh();
      toast.success('Đã xóa media', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', {
        id: toastId
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Media</h1>
          <p className='text-sm text-muted-foreground'>Upload images & files for CMS content.</p>
        </div>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB] ${
            uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? <Spinner className='size-4 text-white' /> : null}
          {uploading ? 'Uploading…' : 'Upload file'}
          <input
            type='file'
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

      {loadingList ? (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Spinner />
          Đang tải media…
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6'>
          {items.map((item) => (
            <div
              key={item.id}
              className='relative overflow-hidden rounded-lg border border-border bg-card'
            >
              {deletingId === item.id ? (
                <div className='absolute inset-0 z-10 flex items-center justify-center bg-background/70'>
                  <Spinner />
                </div>
              ) : null}
              {item.mimeType?.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.filename}
                  className='aspect-square w-full object-cover'
                />
              ) : (
                <div className='flex aspect-square items-center justify-center bg-muted p-3 text-center text-xs text-foreground'>
                  {item.filename}
                </div>
              )}
              <div className='space-y-1 p-2'>
                <p className='truncate text-xs font-medium text-foreground'>{item.filename}</p>
                <div className='flex items-center justify-between gap-2'>
                  <a
                    href={item.url}
                    target='_blank'
                    rel='noreferrer'
                    className='text-xs text-[#22AAFF] hover:underline'
                  >
                    Open
                  </a>
                  <button
                    type='button'
                    disabled={deletingId != null}
                    className='text-xs text-red-600 hover:underline disabled:opacity-50'
                    onClick={() => void onDelete(item.id)}
                  >
                    {deletingId === item.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingList && items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>Chưa có media.</p>
      ) : null}
    </div>
  );
}
