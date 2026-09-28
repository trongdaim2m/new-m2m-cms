'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui/spinner';

export function ContactDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm('Xóa liên hệ này?')) return;
    setBusy(true);
    const toastId = toast.loading('Đang xóa…');
    try {
      const res = await fetch(`/api/cms/contact-inquiries/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message || 'Delete failed');
      }
      toast.success('Đã xóa', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed', {
        id: toastId
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type='button'
      disabled={busy}
      onClick={() => void onDelete()}
      className='inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50'
    >
      {busy ? <Spinner className='size-3' /> : null}
      Xóa
    </button>
  );
}
