import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * SERVICIO DE AUTENTICACIÓN (LARAVEL SANCTUM SPA)
 * Gestiona el ciclo de vida de la sesión del usuario, la protección CSRF 
 * y mantiene el estado global reactivo mediante Angular Signals.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = environment.apiUrl;
  // VITAL: La ruta de Sanctum no lleva "/api", va directo al dominio base
  private backendUrl = environment.backendUrl; 

  // 🚀 ESTADO GLOBAL REACTIVO (Angular 18 Signals)
  // Permite que cualquier componente se suscriba pasivamente a estos valores sin RxJS.
  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  /**
   * PASO 1 DE SANCTUM: INICIALIZACIÓN CSRF
   * Pide la cookie de seguridad (`XSRF-TOKEN`) al backend antes de cualquier intento de Login.
   * Es obligatorio en la arquitectura SPA para evitar ataques de falsificación de peticiones.
   *
   * @returns Un Observable que completa la asignación de cookies en el navegador.
   */
  getCsrfToken(): Observable<any> {
    return this.http.get(`${this.backendUrl}/sanctum/csrf-cookie`);
  }

  /**
   * PASO 2: INICIO DE SESIÓN
   * Envía las credenciales del usuario a la API. Si es exitoso, Laravel establece
   * la cookie de sesión cifrada (`laravel_session`) y el servicio actualiza las Signals.
   *
   * @param credentials Objeto con el email y la contraseña del usuario.
   * @returns Un Observable con los datos del usuario logueado.
   */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Si el login es correcto, hidratamos el estado global
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  /**
   * PASO 2.B: REGISTRO DE NUEVO USUARIO
   * Crea una cuenta nueva en el sistema. Laravel autologuea al usuario tras el registro,
   * por lo que el comportamiento reactivo es idéntico al del método login().
   *
   * @param userData Objeto con nombre, email, password y confirmación.
   * @returns Un Observable con los datos del nuevo usuario.
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((response: any) => {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  /**
   * CERRAR SESIÓN
   * Invalida la sesión actual en el backend y destruye las cookies. En el frontend,
   * limpia las Signals devolviendo la aplicación al estado de "visitante anónimo".
   *
   * @returns Un Observable que confirma el cierre en el servidor.
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        // Purgamos los datos reactivos de la RAM
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      })
    );
  }

  /**
   * COMPROBAR SESIÓN LÍMPIA (APP_INITIALIZER)
   * Consulta el estado de la sesión sin golpear rutas protegidas que lanzarían errores 401
   * en la consola. Retorna el usuario si hay sesión activa, o null (200 OK) si no la hay.
   *
   * @returns Un Observable que sincroniza el backend con las Signals durante el arranque de Angular.
   */
  checkAuth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth-status`).pipe(
      tap({
        next: (response: any) => {
          if (response.user) {
            // Usuario reconocido por Sanctum
            this.currentUser.set(response.user);
            this.isAuthenticated.set(true);
          } else {
            // Visitante anónimo pacífico (código 200 OK)
            this.currentUser.set(null);
            this.isAuthenticated.set(false);
          }
        },
        error: () => {
          // Fallback de seguridad por si el servidor de Laravel está caído
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
        }
      })
    );
  }
}