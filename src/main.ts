import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeHe from '@angular/common/locales/he';

import { AppComponent } from './app.component';
import { APP_ROUTES } from './app.routes';
import { ErrorLoggingService } from './services/error-logging.service';

// Register Hebrew locale
registerLocaleData(localeHe, 'he');

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
    },
    {
      provide: LOCALE_ID,
      useValue: 'he'
    }
  ],
}).catch((err) => console.error(err));
