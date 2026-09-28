'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function UserNav() {
  const router = useRouter();
  const [label, setLabel] = useState('CMS Admin');

  useEffect(() => {
    try {
      const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('m2m_cms_user='))
        ?.split('=')
        .slice(1)
        .join('=');
      if (raw) {
        const user = JSON.parse(decodeURIComponent(raw)) as {
          name?: string;
          email?: string;
        };
        setLabel(user.name || user.email || 'CMS Admin');
      }
    } catch {
      // ignore
    }
  }, []);

  async function logout() {
    await fetch('/api/cms/logout', { method: 'POST' });
    router.replace('/auth/cms-login');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' className='relative h-8 rounded-full px-3' />}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' sideOffset={10}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void logout()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
