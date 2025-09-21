

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  // Fix: standalone: true is the default in Angular v20+ and should be removed.
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  errorMessage = signal<string | null>(null);

  // Fix: Use inject() instead of constructor injection.
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin']);
    }
  }

  async onLogin() {
    this.errorMessage.set(null);
    const success = await this.authService.login(this.username(), this.password());
    if (success) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.errorMessage.set('שם משתמש או סיסמה שגויים');
    }
  }

  async useDemoCredentials() {
    this.username.set('admin@example.com');
    this.password.set('password');
    await this.onLogin();
  }
}
