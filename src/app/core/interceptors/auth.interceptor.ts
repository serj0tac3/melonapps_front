import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Función auxiliar para leer cookies del navegador
  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  };

  // Buscamos la cookie de seguridad que nos dio Laravel en getCsrfToken()
  const xsrfToken = getCookie('XSRF-TOKEN');

  // 2. Preparamos las cabeceras base
  let headersConfig: any = {
    'Accept': 'application/json',
  };

  // 🚀 EL TRUCO MÁGICO: Si tenemos el token, lo forzamos en la cabecera
  if (xsrfToken) {
    headersConfig['X-XSRF-TOKEN'] = xsrfToken;
  }

  // 3. Clonamos la petición adjuntando las credenciales y las cabeceras
  const authReq = req.clone({
    withCredentials: true, 
    setHeaders: headersConfig
  });

  return next(authReq);
};