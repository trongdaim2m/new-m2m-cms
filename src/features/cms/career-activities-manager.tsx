'use client';

import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type ActivityItem = {
  id: string;
  alt: string;
  imageUrl: string;
  mediaId: string | null;
  sortOrder: number;
  isPublished: boolean;
};

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

function parseList<T>(json: { data?: unknown }): T[] {
  const raw = json.data;
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

export function CareerActivitiesManager() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [altDraft, setAltDraft] = useState('');

  async function refresh() {
    try {
      const [actRes, mediaRes] = await Promise.all([
        fetch('/api/cms/career-activities'),
        fetch('/api/cms/media?pageSize=48')
      ]);
      const actJson = await actRes.json();
      const mediaJson = await mediaRes.json();
      if (!actRes.ok || actJson.success === false) {
        throw new Error(actJson?.error?.message || 'Load activities failed');
      }
      setItems(parseList<ActivityItem>(actJson));
      setLibrary(parseList<MediaItem>(mediaJson).filter((m) => m.mimeType?.startsWith('image/')));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onUpload(file: File) {
    setBusy(true);
    const toastId = toast.loading('Đang upload ảnh…');
    try {
      const body = new FormData();
      body.append('file', file);
      const upRes = await fetch('/api/cms/media/upload', {
        method: 'POST',
        body
      });
      const upJson = await upRes.json();
      if (!upRes.ok || upJson.success === false) {
        throw new Error(upJson?.error?.message || 'Upload failed');
      }
      const media = upJson.data as MediaItem;
      const res = await fetch('/api/cms/career-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: media.id,
          alt: altDraft.trim() || file.name.replace(/\.[^.]+$/, ''),
          isPublished: true
        })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Create failed');
      }
      setAltDraft('');
      await refresh();
      toast.success('Đã thêm ảnh activity', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed', {
        id: toastId
      });
    } finally {
      setBusy(false);
    }
  }

  async function addFromLibrary(media: MediaItem) {
    setBusy(true);
    const toastId = toast.loading('Đang thêm…');
    try {
      const res = await fetch('/api/cms/career-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: media.id,
          alt: altDraft.trim() || media.filename.replace(/\.[^.]+$/, ''),
          isPublished: true
        })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Create failed');
      }
      setAltDraft('');
      await refresh();
      toast.success('Đã thêm ảnh từ thư viện', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed', { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(item: ActivityItem) {
    setBusy(true);
    try {
      const res = await fetch(`/api/cms/career-activities/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !item.isPublished })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Update failed');
      }
      await refresh();
      toast.success(item.isPublished ? 'Đã ẩn ảnh' : 'Đã hiện ảnh');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function updateAlt(item: ActivityItem, alt: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/cms/career-activities/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Update failed');
      }
      await refresh();
      toast.success('Đã cập nhật alt');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: ActivityItem) {
    if (!window.confirm('Xóa ảnh này khỏi SOME ACTIVITES?')) return;
    setBusy(true);
    const toastId = toast.loading('Đang xóa…');
    try {
      const res = await fetch(`/api/cms/career-activities/${item.id}`, {
        method: 'DELETE'
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message || 'Delete failed');
      }
      await refresh();
      toast.success('Đã xóa', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed', {
        id: toastId
      });
    } finally {
      setBusy(false);
    }
  }

  async function move(item: ActivityItem, direction: -1 | 1) {
    const index = items.findIndex((x) => x.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    setItems(next);
    setBusy(true);
    try {
      const res = await fetch('/api/cms/career-activities/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((x) => x.id) })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Reorder failed');
      }
      const list = Array.isArray(json.data) ? json.data : next;
      setItems(list as ActivityItem[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reorder failed');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner />
        Đang tải activities…
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-lg border border-border bg-card p-4'>
        <h2 className='text-base font-semibold'>Thêm ảnh</h2>
        <p className='mt-1 text-xs text-muted-foreground'>
          Section Career &quot;SOME ACTIVITES&quot; — khuyến nghị 8–10 ảnh.
        </p>
        <div className='mt-3 flex flex-wrap items-end gap-3'>
          <label className='space-y-1 text-sm'>
            <span className='font-medium'>Alt (tuỳ chọn)</span>
            <input
              className='block w-64 rounded-md border border-border bg-background px-3 py-2 text-sm'
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              placeholder='チームミーティング'
              disabled={busy}
            />
          </label>
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#22AAFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B6EAB] ${
              busy ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {busy ? <Spinner className='size-4 text-white' /> : null}
            Upload ảnh mới
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
        </div>

        {library.length > 0 ? (
          <div className='mt-4'>
            <p className='mb-2 text-xs font-medium text-muted-foreground'>
              Hoặc chọn từ Media library
            </p>
            <div className='grid max-h-40 grid-cols-6 gap-2 overflow-auto sm:grid-cols-8'>
              {library.map((media) => (
                <button
                  key={media.id}
                  type='button'
                  disabled={busy}
                  title={media.filename}
                  className='overflow-hidden rounded border border-transparent hover:border-[#22AAFF] disabled:opacity-50'
                  onClick={() => void addFromLibrary(media)}
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
          </div>
        ) : null}
      </div>

      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5'>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`overflow-hidden rounded-lg border bg-card ${
              item.isPublished ? 'border-border' : 'border-dashed border-amber-500/60 opacity-70'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.alt} className='aspect-[4/3] w-full object-cover' />
            <div className='space-y-2 p-2'>
              <input
                className='w-full rounded border border-border bg-background px-2 py-1 text-xs'
                defaultValue={item.alt}
                disabled={busy}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next !== item.alt) void updateAlt(item, next);
                }}
              />
              <div className='flex flex-wrap items-center gap-1 text-[11px]'>
                <button
                  type='button'
                  disabled={busy || index === 0}
                  className='rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30'
                  onClick={() => void move(item, -1)}
                >
                  ←
                </button>
                <button
                  type='button'
                  disabled={busy || index === items.length - 1}
                  className='rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30'
                  onClick={() => void move(item, 1)}
                >
                  →
                </button>
                <button
                  type='button'
                  disabled={busy}
                  className='rounded px-1.5 py-0.5 text-[#22AAFF] hover:underline disabled:opacity-50'
                  onClick={() => void togglePublished(item)}
                >
                  {item.isPublished ? 'Ẩn' : 'Hiện'}
                </button>
                <button
                  type='button'
                  disabled={busy}
                  className='rounded px-1.5 py-0.5 text-red-600 hover:underline disabled:opacity-50'
                  onClick={() => void removeItem(item)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          Chưa có ảnh. Upload hoặc chọn từ Media library.
        </p>
      ) : null}
    </div>
  );
}
