import { Routes } from '@angular/router';
import { CardDetailComponent } from './pages/card-detail/card-detail';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'collection',
    loadComponent: () => import('./pages/collection/collection').then(m => m.CollectionComponent)
  },
  { 
    path: 'card/:id', 
    component: CardDetailComponent 
  },
  // 🚀 Nuevas rutas de Autenticación
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    // Aunque aún no hemos creado el componente, dejamos la ruta preparada
    loadComponent: () => import('./pages/auth/register/register').then(m => m.RegisterComponent) 
  },
  // La ruta comodín siempre debe ir al final
  {
    path: '**',
    redirectTo: '' 
  }
];