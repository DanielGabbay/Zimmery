import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler, provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './app.component';
import { APP_ROUTES } from './app.routes';
import { ErrorLoggingService } from './services/error-logging.service';

class GlobalErrorHandler implements ErrorHandler {
  constructor(private errorLoggingService: ErrorLoggingService) {}

  handleError(error: any): void {
    this.errorLoggingService.logError(error);
    console.error('Global Error:', error);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(),
    ErrorLoggingService,
    {
      provide: ErrorHandler,
      useFactory: (errorLoggingService: ErrorLoggingService) => new GlobalErrorHandler(errorLoggingService),
      deps: [ErrorLoggingService]
    }
  ],
}).catch((err) => console.error(err));
