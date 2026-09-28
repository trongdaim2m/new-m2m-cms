'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const statuses = ['new', 'reviewing', 'replied', 'archived'] as const;

export function ContactStatusSelect({ inquiry }: { inquiry: { id: string; status: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState(inquiry.status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/contact-inquiries/${inquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message || 'Update failed');
      }
      toast.success('Đã cập nhật status');
      router.refresh();
    } catch (err) {
      setStatus(inquiry.status);
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className='rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground'
      value={status}
      disabled={saving}
      onChange={(e) => void onChange(e.target.value)}
    >
      {statuses.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
