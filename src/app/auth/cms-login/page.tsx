'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useId, useState } from 'react';

export default function CmsLoginPage() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('admin@m2m.local');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cms/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Login failed');
      }
      router.replace('/dashboard/news');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='relative flex min-h-svh overflow-hidden bg-[#0B1F33] text-white'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,170,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(11,110,171,0.22),transparent_50%)]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:48px_48px]'
      />

      <div className='relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10'>
        <aside className='hidden max-w-md flex-1 space-y-5 lg:block'>
          <p className='text-sm font-semibold tracking-[0.18em] text-[#7DD3FF] uppercase'>
            M&amp;M Solutions
          </p>
          <h1 className='text-4xl leading-tight font-semibold text-white xl:text-5xl'>
            Content Management
          </h1>
          <p className='text-base leading-relaxed text-white/70'>
            Đăng nhập để quản lý News, Projects, Careers và Applications cho website M&amp;M.
          </p>
        </aside>

        <form
          onSubmit={onSubmit}
          className='w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 text-[#0F172A] shadow-[0_24px_80px_rgba(0,0,0,0.35)]'
        >
          <div className='mb-8 space-y-2'>
            <div className='h-1.5 w-14 rounded-full bg-[#22AAFF]' aria-hidden />
            <h2 className='text-2xl font-semibold tracking-tight text-[#0F172A]'>Sign in to CMS</h2>
            <p className='text-sm text-[#64748B]'>Dùng tài khoản admin từ new-backend.</p>
          </div>

          <div className='space-y-5'>
            <div className='space-y-2'>
              <label htmlFor={emailId} className='block text-sm font-medium text-[#334155]'>
                Email
              </label>
              <input
                id={emailId}
                className='h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-[15px] text-[#0F172A] caret-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#22AAFF] focus:ring-3 focus:ring-[#22AAFF]/20'
                type='email'
                autoComplete='username'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='admin@m2m.local'
                required
              />
            </div>

            <div className='space-y-2'>
              <label htmlFor={passwordId} className='block text-sm font-medium text-[#334155]'>
                Password
              </label>
              <div className='relative'>
                <input
                  id={passwordId}
                  className='h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 pr-12 text-[15px] text-[#0F172A] caret-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#22AAFF] focus:ring-3 focus:ring-[#22AAFF]/20'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  required
                />
                <button
                  type='button'
                  className='absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error ? (
              <p
                role='alert'
                className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
              >
                {error}
              </p>
            ) : null}

            <button
              type='submit'
              disabled={loading}
              className='flex h-11 w-full items-center justify-center rounded-lg bg-[#22AAFF] text-sm font-semibold text-white transition hover:bg-[#0B6EAB] disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          <p className='mt-6 text-center text-xs text-[#94A3B8]'>
            Local default: <span className='font-medium text-[#64748B]'>admin@m2m.local</span>
          </p>
        </form>
      </div>
    </div>
  );
}
