import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideTranslocoConfig } from './core/i18n/transloco.config';
import { problemDetailInterceptor } from './core/interceptors/problem-detail.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([problemDetailInterceptor])),
    provideRouter(routes),
    provideTranslocoConfig(),
  ],
};
