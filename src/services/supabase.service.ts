

import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public readonly supabase: SupabaseClient | null = null;
  private readonly _isConfigured = signal<boolean>(false);
  public readonly isConfigured = this._isConfigured.asReadonly();

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseKey;

    if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this._isConfigured.set(true);
    } else {
        console.error("Supabase URL and Key are not set in the environment file.");
    }
  }
}