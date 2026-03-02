import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { InterCeptorEngine } from '../services/engine/interceptor_engine';

export const appConfig: ApplicationConfig = {
  providers: [
    CookieService,
    provideHttpClient(
      withFetch(),
      withInterceptors([InterCeptorEngine]) // add your interceptor here
    ),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes,  withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })), provideClientHydration(withEventReplay())
      
  ]
};
