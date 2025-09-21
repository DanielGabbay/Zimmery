

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ErrorLoggingService } from '../../../services/error-logging.service';

@Component({
  selector: 'app-support',
  // Fix: standalone: true is the default in Angular v20+ and should be removed.
  imports: [CommonModule, DatePipe],
  templateUrl: './support.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportComponent {
  errorLoggingService = inject(ErrorLoggingService);
  errors = this.errorLoggingService.errors;

  async clearLogs() {
    if(confirm('האם אתה בטוח שברצונך למחוק את כל יומני השגיאות?')) {
        await this.errorLoggingService.clearErrors();
    }
  }

  generateTestError() {
    // This will be caught by the global error handler
    throw new Error('This is a test error generated from the support page.');
  }
}
