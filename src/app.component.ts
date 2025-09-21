
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  template: `
    @if (isConfigured()) {
      <router-outlet></router-outlet>
    } @else {
      <div class="flex items-center justify-center min-h-screen bg-red-50 text-red-800 dark:bg-gray-900 dark:text-red-300">
        <div class="w-full max-w-2xl p-8 mx-4 text-center bg-white border-2 border-red-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-red-700">
          <svg class="w-16 h-16 mx-auto text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 class="mt-4 text-3xl font-bold text-red-900 dark:text-red-200">שגיאת תצורה</h1>
          <p class="mt-4 text-lg text-gray-700 dark:text-gray-300">
            האפליקציה אינה מוגדרת כראוי.
          </p>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            נדרש להגדיר את משתני הסביבה <code>SUPABASE_URL</code> ו-<code>SUPABASE_KEY</code> על מנת שהמערכת תעבוד.
          </p>
          <p class="mt-6 text-sm text-gray-500 dark:text-gray-500">
            אנא פנה למנהל המערכת או עיין בתיעוד להוראות הגדרה.
          </p>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
})
export class AppComponent {
  private supabaseService = inject(SupabaseService);
  isConfigured = this.supabaseService.isConfigured;
}
