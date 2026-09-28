'use client';

import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getSectionSchema } from './page-config';

type SectionRow = {
  key: string;
  isVisible: boolean;
  sortOrder: number;
  updatedAt: string;
};

export function PageSectionsManager({ page }: { page: string }) {
  const apiBase = `/api/cms/pages/${page}/sections`;
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Không tải được danh sách section');
      }
      setRows(json.data as SectionRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách section');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [page]);

  async function toggleVisible(row: SectionRow) {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/${row.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !row.isVisible })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Cập nhật thất bại');
      }
      setRows((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, isVisible: !row.isVisible } : r))
      );
      toast.success(row.isVisible ? 'Đã ẩn section' : 'Đã hiện section');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setBusy(false);
    }
  }

  async function moveRow(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setRows(next);
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: next.map((r) => r.key) })
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Sắp xếp thất bại');
      }
      setRows(json.data as SectionRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sắp xếp thất bại');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner />
        Đang tải sections…
      </div>
    );
  }

  return (
    <div className='overflow-hidden rounded-lg border border-border bg-card'>
      {rows.map((row, index) => {
        const schema = getSectionSchema(page, row.key);
        return (
          <div
            key={row.key}
            className={`flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 ${
              row.isVisible ? '' : 'opacity-60'
            }`}
          >
            <span className='w-6 text-sm text-muted-foreground'>{index + 1}</span>
            <div className='min-w-0 flex-1'>
              <p className='font-medium'>
                {schema?.title ?? row.key}
                {!row.isVisible ? (
                  <span className='ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] text-amber-600'>
                    Đang ẩn
                  </span>
                ) : null}
              </p>
              <p className='truncate text-xs text-muted-foreground'>{schema?.description}</p>
            </div>
            <div className='flex items-center gap-1 text-sm'>
              <button
                type='button'
                title='Lên'
                disabled={busy || index === 0}
                className='rounded px-2 py-1 text-muted-foreground hover:bg-muted disabled:opacity-30'
                onClick={() => void moveRow(index, -1)}
              >
                ↑
              </button>
              <button
                type='button'
                title='Xuống'
                disabled={busy || index === rows.length - 1}
                className='rounded px-2 py-1 text-muted-foreground hover:bg-muted disabled:opacity-30'
                onClick={() => void moveRow(index, 1)}
              >
                ↓
              </button>
              <button
                type='button'
                disabled={busy}
                className='rounded px-2 py-1 text-[#22AAFF] hover:underline disabled:opacity-50'
                onClick={() => void toggleVisible(row)}
              >
                {row.isVisible ? 'Ẩn' : 'Hiện'}
              </button>
              <Link
                href={`/dashboard/pages/${page}/${row.key}`}
                className='ml-1 rounded-md bg-[#22AAFF] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0B6EAB]'
              >
                Sửa nội dung
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
