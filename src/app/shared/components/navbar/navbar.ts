import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // 🚀 AÑADIDO RouterLinkActive
import { AuthService } from '../../../core/services/auth'; // Ajusta la ruta a tu proyecto

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], // 🚀 AÑADIDO RouterLinkActive AQUÍ
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  authService = inject(AuthService);

  logout() {
    this.authService.logout().subscribe();
  }
}