'use client';

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';

/** CMS mode: show all nav items (no Clerk RBAC). */
export function useFilteredNavItems(items: NavItem[]) {
  return useMemo(() => items, [items]);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  return useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items
        }))
        .filter((group) => group.items.length > 0),
    [groups]
  );
}
