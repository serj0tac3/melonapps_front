import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // ✅ Solo peticiones a tu backend
  const isApiCall = req.url.startsWith(environment.apiUrl);

  if (!isApiCall) {
    return next(req);
  }

  // ✅ Solo dos responsabilidades: credenciales + Accept header
  // El XSRF-TOKEN lo gestiona Angular automáticamente via withXsrfConfiguration
  const authReq = req.clone({
    withCredentials: true,
    setHeaders: {
      'Accept': 'application/json',
    },
  });

  return next(authReq);
};