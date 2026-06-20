export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  backendUrl: 'http://localhost:8000' // Vital para que Sanctum pueda pedir la cookie CSRF de Laravel
};