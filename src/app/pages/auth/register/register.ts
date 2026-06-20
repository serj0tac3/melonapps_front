import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    // 1. Pedimos la cookie CSRF por seguridad
    this.authService.getCsrfToken().pipe(
      // 2. Enviamos los datos de registro
      switchMap(() => this.authService.register(this.registerForm.value))
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']); // Al registrarse, Laravel nos loguea y volvemos al inicio
      },
      error: (err) => {
        this.isLoading.set(false);
        // Capturamos los errores de validación de Laravel (ej. "El email ya existe")
        if (err.error?.errors) {
          const firstErrorKey = Object.keys(err.error.errors)[0];
          this.errorMessage.set(err.error.errors[firstErrorKey][0]);
        } else {
          this.errorMessage.set(err.error?.message || 'Error al crear la cuenta.');
        }
      }
    });
  }
}