import { lazy } from 'react';

const Import = lazy(() => import('@appv2/pages/Import'));
const TaskCreate = lazy(() => import('@appv2/pages/Import/TaskCreate'));


export const RoutesList = [
  {
    path: '/import/create',
    component: TaskCreate,
    exact: true,
  },
  {
    path: '/import/:type',
    component: Import,
  },
];

export const MENU_LIST = [
  {
    key: 'schema',
    path: '/schema',
    track: {
      category: 'navigation',
      action: 'view_schema',
      label: 'from_navigation'
    },
    icon: 'iconnav-model',
    intlKey: 'common.schema'
  },
  {
    key: 'import',
    path: '/import/files',
    track: {
      category: 'navigation',
      action: 'view_import',
      label: 'from_navigation'
    },
    icon: 'iconnav-model',
    intlKey: 'common.import'
  },
  {
    key: 'console',
    path: '/console',
    track: {
      category: 'navigation',
      action: 'view_console',
      label: 'from_navigation'
    },
    icon: 'iconnav-model',
    intlKey: 'common.console'
  },
];