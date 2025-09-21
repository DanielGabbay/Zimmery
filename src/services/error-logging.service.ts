
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
  private isTableAvailable = false;
  
  errors = signal<LoggedError[]>([]);

  constructor() {
    if (this.supabase) {
        this.loadFromSupabase();
    }
  }

  private async loadFromSupabase(): Promise<void> {
    if (!this.supabase) return;
    
    try {
      const { data, error } = await this.supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(this.MAX_ERRORS);
      
      if (error) {
        // If table doesn't exist, try to create it
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
          console.warn('Error logs table not found. Attempting to create it...');
          const created = await this.createErrorLogsTable();
          if (created) {
            console.log('Error logs table created successfully!');
            this.isTableAvailable = true;
          } else {
            console.warn('Could not create error logs table. Error logging will work in memory only.');
            this.isTableAvailable = false;
          }
          return;
        }
        console.error('Error loading error logs:', error);
        return;
      }
      
      this.isTableAvailable = true;
      this.errors.set(data as LoggedError[]);
    } catch (error) {
      console.warn('Could not load error logs from Supabase:', error);
      this.isTableAvailable = false;
    }
  }

  private async createErrorLogsTable(): Promise<boolean> {
    if (!this.supabase) return false;
    
    try {
      const { error } = await this.supabase.rpc('create_error_logs_table_if_not_exists');
      
      if (error) {
        console.error('Error creating error_logs table via RPC:', error);
        // Try alternative approach using direct SQL
        return await this.createTableDirectSQL();
      }
      
      return true;
    } catch (err) {
      console.error('Error in createErrorLogsTable:', err);
      return await this.createTableDirectSQL();
    }
  }

  private async createTableDirectSQL(): Promise<boolean> {
    if (!this.supabase) return false;
    
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.error_logs (
          id BIGSERIAL PRIMARY KEY,
          message TEXT NOT NULL,
          stack TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
      `;
      
      const { error } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.error('Could not create error_logs table:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in createTableDirectSQL:', err);
      return false;
    }
  }

  async logError(error: any): Promise<void> {
    const newError: LoggedError = {
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      timestamp: new Date()
    };
    
    // Always add to local memory first
    this.errors.update(currentErrors => {
      const updatedErrors = [newError, ...currentErrors];
      if (updatedErrors.length > this.MAX_ERRORS) {
        updatedErrors.pop();
      }
      return updatedErrors;
    });
    
    // Try to log to Supabase if available and table exists
    if (!this.supabase || !this.isTableAvailable) {
      console.warn('Supabase not configured or error_logs table not available. Error logged locally only:', newError);
      return;
    }
    
    try {
      const { error: insertError } = await this.supabase
        .from('error_logs')
        .insert({
          message: newError.message,
          stack: newError.stack,
          timestamp: newError.timestamp.toISOString()
        });
      
      if (insertError) {
        console.warn('Failed to log error to Supabase (error stored locally):', insertError);
      }
    } catch (err) {
      console.warn('Error while trying to log to Supabase (error stored locally):', err);
    }
  }

  async clearErrors(): Promise<void> {
    // Always clear local errors first
    this.errors.set([]);
    
    // Try to clear from Supabase if available and table exists
    if (!this.supabase || !this.isTableAvailable) {
      console.warn('Supabase not configured or error_logs table not available. Cleared locally only.');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('error_logs')
        .delete()
        .gt('id', 0); // Delete all rows
      
      if (error) {
        console.warn('Error clearing logs from Supabase:', error);
      }
    } catch (err) {
      console.warn('Error while trying to clear logs from Supabase:', err);
    }
  }
}
