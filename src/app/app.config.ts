import {
  ApplicationConfig,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
  isDevMode
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration
} from '@angular/common/http';
import { lastValueFrom, catchError, of, tap } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),

    provideHttpClient(
      // ✅ withFetch() eliminado — más predecible con cookies en Safari y proxies
      withInterceptors([authInterceptor]),

      // ✅ Explícito: le decimos a Angular exactamente cómo se llaman
      // la cookie y el header CSRF de Laravel
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),

    provideAppInitializer(() => {
      const authService = inject(AuthService);

      return lastValueFrom(
        authService.checkAuth().pipe(

          // ✅ Diferenciamos entre errores esperados (401) y errores reales
          catchError((error) => {
            // 401 = no hay sesión activa — es el caso normal, no es un error
            if (error?.status === 401) {
              return of(null);
            }

            // Cualquier otro error (red caída, 500, timeout) lo logueamos
            // para poder detectarlo en producción sin romper el arranque
            if (isDevMode()) {
              console.warn('[AppInitializer] Error al verificar sesión:', error);
            }

            // Aun así dejamos que la app arranque — el usuario verá el login
            return of(null);
          })
        )
      );
    }),
  ]
};