import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { lastValueFrom, catchError, of } from 'rxjs'; // 🚀 Nuevos imports de RxJS

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth'; // 🚀 Asegúrate de que la ruta sea correcta

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    // 🚀 LA ARQUITECTURA PURA: Angular no dibujará nada hasta que esto termine
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return lastValueFrom(
        authService.checkAuth().pipe(
          catchError(() => of(null)) // Si no hay sesión, no pasa nada, arranca igual
        )
      );
    })
  ]
};