import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Estado global de las notificaciones activas
  toasts = signal<Toast[]>([]);

  // Métodos rápidos para cada tipo de alerta
  success(title: string, message: string) {
    this.show({ id: this.generateId(), type: 'success', title, message });
  }

  error(title: string, message: string) {
    this.show({ id: this.generateId(), type: 'error', title, message });
  }

  info(title: string, message: string) {
    this.show({ id: this.generateId(), type: 'info', title, message });
  }

  // Lógica interna para mostrar y programar el auto-cierre
  private show(toast: Toast) {
    this.toasts.update(currentToasts => [...currentToasts, toast]);

    // Auto-eliminar después de 3.5 segundos
    setTimeout(() => {
      this.remove(toast.id);
    }, 3500);
  }

  // Eliminar una notificación (manual o por tiempo)
  remove(id: string) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t.id !== id));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}