import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// ✅ Tipo explícito — si el backend cambia, TypeScript avisa
export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private http       = inject(HttpClient);
  private apiUrl     = environment.apiUrl;
  private backendUrl = environment.backendUrl;

  // ✅ Tipado correcto — no any
  currentUser     = signal<AuthUser | null>(null);
  isAuthenticated = signal<boolean>(false);

  // ─────────────────────────────────────────────────────────────
  // PRIVADO: obtener cookie CSRF
  // No se expone — es un detalle de implementación, no una API pública
  // ─────────────────────────────────────────────────────────────
  private getCsrfToken(): Observable<void> {
    return this.http.get<void>(`${this.backendUrl}/sanctum/csrf-cookie`);
  }

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // getCsrfToken() es interno — el componente solo llama a login()
  // ─────────────────────────────────────────────────────────────
  login(credentials: { email: string; password: string }): Observable<{ user: AuthUser }> {
    return this.getCsrfToken().pipe(
      // ✅ switchMap encadena: primero la cookie, luego el POST
      // Si getCsrfToken() falla, el POST nunca se ejecuta
      switchMap(() =>
        this.http.post<{ user: AuthUser }>(`${this.apiUrl}/login`, credentials)
      ),
      tap(response => {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  // REGISTRO
  // Mismo patrón que login — CSRF primero, luego el POST
  // ─────────────────────────────────────────────────────────────
  register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ user: AuthUser }> {
    return this.getCsrfToken().pipe(
      switchMap(() =>
        this.http.post<{ user: AuthUser }>(`${this.apiUrl}/register`, userData)
      ),
      tap(response => {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      })
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VERIFICAR SESIÓN AL ARRANCAR (APP_INITIALIZER)
  // ✅ Usa /user en lugar de /auth-status
  // - Si hay sesión: 200 + datos del usuario
  // - Si no hay sesión: 401 — capturado en app.config.ts con catchError
  // ─────────────────────────────────────────────────────────────
  checkAuth(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/user`).pipe(
      tap(user => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      })
    );
  }
}