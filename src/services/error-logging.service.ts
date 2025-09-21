
import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface LoggedError {
  id?: number;
  message: string;
  stack?: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ErrorLoggingService {
  private supabase: SupabaseClient | null = inject(SupabaseService).supabase;
  private readonly MAX_ERRORS = 10;
  
  errors = signal<LoggedError[]>([]);

  constructor() {
    if (this.supabase) {
        this.loadFromSupabase();
    }
  }

  private async loadFromSupabase(): Promise<void> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from('error_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(this.MAX_ERRORS);
    
    if (error) {
        console.error('Error loading error logs:', error);
        return;
    }
    this.errors.set(data as LoggedError[]);
  }

  async logError(error: any): Promise<void> {
    const newError: Omit<LoggedError, 'id' | 'timestamp'> = {
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
    };
    
    if (!this.supabase) {
        console.warn('Supabase not configured. Error not logged to backend:', newError);
        return;
    }
    
    const { data, error: insertError } = await this.supabase
        .from('error_logs')
        .insert(newError)
        .select()
        .single();
    
    if (insertError) {
        console.error('Failed to log error to Supabase:', insertError);
        return;
    }

    if (data) {
        this.errors.update(currentErrors => {
            const updatedErrors = [data as LoggedError, ...currentErrors];
            if (updatedErrors.length > this.MAX_ERRORS) {
                updatedErrors.pop();
            }
            return updatedErrors;
        });
    }
  }

  async clearErrors(): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase
        .from('error_logs')
        .delete()
        .gt('id', 0); // Delete all rows
    
    if (error) {
        console.error('Error clearing logs from Supabase:', error);
        return;
    }
    this.errors.set([]);
  }
}
