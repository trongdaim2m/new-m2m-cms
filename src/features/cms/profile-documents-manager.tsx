'use client';

import { Spinner } from '@/components/ui/spinner';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type ProfileCode = 'COMPANY_PROFILE' | 'PROJECT_HISTORY' | 'AI_IOT_SOLUTIONS';

type ProfileRow = {
  code: ProfileCode;
  displayName: string;
  media: {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
  } | null;
  updatedAt: string;
};

async function readApiJson(res: Response) {
  const text = await res.text();
  if (!text.trim()) {
    return { success: false as const, error: { message: `HTTP ${res.status}` } };
  }
  try {
    return JSON.parse(text) as {
      success?: boolean;
      data?: unknown;
      error?: { message?: string };
    };
  } catch {
    return { success: false as const, error: { message: text.slice(0, 200) } };
  }
}

const TABS: { code: ProfileCode; label: string; hint: string }[] = [
  {
    code: 'COMPANY_PROFILE',
    label: 'Company profile',
    hint: 'Header menu — ① Company Profile'
  },
  {
    code: 'PROJECT_HISTORY',
    label: 'Project history',
    hint: 'Footer / Projects — portfolio PDF (lịch sử dự án)'
  },
  {
    code: 'AI_IOT_SOLUTIONS',
    label: 'AI-IoT solutions',
    hint: 'Header menu — AI-IoT deck'
  }
];

export function ProfileDocumentsManager() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ProfileCode>('PROJECT_HISTORY');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState('');

  const current = rows.find((r) => r.code === active);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/profile-documents');
      const json = await readApiJson(res);
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Không tải được danh sách PDF');
      }
      const list = (json.data as ProfileRow[]) || [];
      setRows(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được danh sách PDF');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPendingMediaId(null);
    setPendingName('');
  }, [active]);

  async function onUpload(file: File) {
    if (file.type !== 'application/pdf') {
      toast.error('Chỉ chấp nhận file PDF');
      return;
    }
    setUploading(true);
    const toastId = toast.loading('Đang upload PDF…');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/cms/media/upload', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Upload thất bại');
      }
      const media = json.data as { id: string; filename: string };
      setPendingMediaId(media.id);
      setPendingName(media.filename);
      toast.success('Đã upload — nhấn Lưu để áp dụng', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload thất bại', { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    const mediaId = pendingMediaId || current?.media?.id;
    if (!mediaId) {
      toast.error('Chọn hoặc upload file PDF trước');
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Đang lưu…');
    try {
      const res = await fetch(`/api/cms/profile-documents/${active}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          displayName: pendingName || current?.displayName || undefined
        })
      });
      const json = await readApiJson(res);
      if (!res.ok || json.success === false) {
        throw new Error(json?.error?.message || 'Lưu thất bại');
      }
      await refresh();
      setPendingMediaId(null);
      toast.success('Đã cập nhật PDF', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lưu thất bại', { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner className='size-4' />
        Đang tải…
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.code === active)!;
  const previewUrl = current?.media?.url;
  const fileLabel =
    pendingName || current?.displayName || current?.media?.filename || 'Chưa có file';

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap gap-2'>
        {TABS.map((tab) => (
          <button
            key={tab.code}
            type='button'
            onClick={() => setActive(tab.code)}
            className={
              active === tab.code
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
                : 'rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='rounded-lg border border-border bg-card p-6'>
        <h2 className='text-lg font-semibold'>{activeTab.label}</h2>
        <p className='mt-1 text-sm text-muted-foreground'>{activeTab.hint}</p>

        <div className='mt-6 space-y-4'>
          <div>
            <p className='text-sm font-medium text-foreground'>File hiện tại</p>
            <p className='mt-1 text-sm text-muted-foreground'>{fileLabel}</p>
            {previewUrl ? (
              <a
                href={previewUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-2 inline-block text-sm text-primary hover:underline'
              >
                Mở PDF trên trình duyệt
              </a>
            ) : null}
          </div>

          <div>
            <label className='text-sm font-medium text-foreground'>Upload PDF mới</label>
            <input
              type='file'
              accept='application/pdf,.pdf'
              className='mt-2 block w-full max-w-md text-sm'
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          <button
            type='button'
            disabled={saving || uploading}
            onClick={() => void onSave()}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50'
          >
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
