import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/user-list/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
