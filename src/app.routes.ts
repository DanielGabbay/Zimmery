
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'sign/:id',
    loadComponent: () => import('./components/sign/sign-agreement.component').then(m => m.SignAgreementComponent)
  },
  {
    path: 'confirmation/:id',
    loadComponent: () => import('./components/sign/confirmation.component').then(m => m.ConfirmationComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard',
        loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      { 
        path: 'new-booking',
        loadComponent: () => import('./components/admin/new-booking/new-booking.component').then(m => m.NewBookingComponent)
      },
      { 
        path: 'support',
        loadComponent: () => import('./components/admin/support/support.component').then(m => m.SupportComponent)
      },
    ]
  },
  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/admin/dashboard' }
];
