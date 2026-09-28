import { NavGroup } from '@/types';

/** CMS navigation — content modules only. */
export const navGroups: NavGroup[] = [
  {
    label: 'Content',
    items: [
      {
        title: 'Pages',
        url: '/dashboard/pages/home',
        icon: 'dashboard',
        isActive: false,
        items: [
          { title: 'Homepage', url: '/dashboard/pages/home' },
          { title: 'About', url: '/dashboard/pages/about' }
        ]
      },
      {
        title: 'News',
        url: '/dashboard/news',
        icon: 'post',
        isActive: true,
        items: []
      },
      {
        title: 'Projects',
        url: '/dashboard/projects',
        icon: 'product',
        isActive: false,
        items: []
      },
      {
        title: 'Careers',
        url: '/dashboard/jobs',
        icon: 'user',
        isActive: false,
        items: [
          { title: 'Jobs', url: '/dashboard/jobs' },
          { title: 'SOME ACTIVITES', url: '/dashboard/jobs/activities' }
        ]
      },
      {
        title: 'Applications',
        url: '/dashboard/applications',
        icon: 'post',
        isActive: false,
        items: []
      },
      {
        title: 'Contacts',
        url: '/dashboard/contacts',
        icon: 'post',
        isActive: false,
        items: []
      },
      {
        title: 'Media',
        url: '/dashboard/media',
        icon: 'product',
        isActive: false,
        items: []
      }
    ]
  }
];
