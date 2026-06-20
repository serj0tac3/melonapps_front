import { HttpInterceptorFn, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // ✅ Solo peticiones a tu backend
  const isApiCall = req.url.startsWith(environment.apiUrl);

  if (!isApiCall) {
    return next(req);
  }

  // 1. Extraemos el token directamente de las cookies usando la herramienta de Angular
  const tokenExtractor = inject(HttpXsrfTokenExtractor);
  const xsrfToken = tokenExtractor.getToken();

  // 2. Empezamos a construir nuestras cabeceras
  let customHeaders = req.headers.set('Accept', 'application/json');

  // 3. ¡LA MAGIA! Si tenemos el token, obligamos a Angular a enviarlo como cabecera
  if (xsrfToken) {
    customHeaders = customHeaders.set('X-XSRF-TOKEN', xsrfToken);
  }

  // 4. Clonamos la petición
  const authReq = req.clone({
    withCredentials: true,
    headers: customHeaders,
  });

  return next(authReq);
};