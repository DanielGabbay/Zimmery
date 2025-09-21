
import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase: SupabaseClient | null = this.supabaseService.supabase;
  private router = inject(Router);

  isLoggedIn = signal<boolean>(false);

  constructor() {
    if (this.supabaseService.isConfigured() && this.supabase) {
        this.supabase.auth.getSession().then(({ data: { session } }) => {
          this.isLoggedIn.set(!!session);
        });

        this.supabase.auth.onAuthStateChange((_event, session) => {
          this.isLoggedIn.set(!!session);
          if (!session) {
            this.router.navigate(['/login']);
          }
        });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    if (!this.supabase) return false;
    
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Login error:', error.message);
      return false;
    }
    return true; // onAuthStateChange will handle signal update
  }

  async logout() {
    if (!this.supabase) return;

    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    }
    // onAuthStateChange will handle signal update and navigation
  }
}
