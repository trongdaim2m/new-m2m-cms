'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ApplicationItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  jobPost: { id: string; slug: string; title: string };
  resumeMedia: { id: string; url: string; filename: string } | null;
};

const statuses = ['new', 'reviewing', 'rejected', 'hired'] as const;

export function ApplicationStatusSelect({ application }: { application: ApplicationItem }) {
  const router = useRouter();
  const [status, setStatus] = useState(application.status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/job-applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) throw new Error('Update failed');
      router.refresh();
    } catch {
      setStatus(application.status);
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
