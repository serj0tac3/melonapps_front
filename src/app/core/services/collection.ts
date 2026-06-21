import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * 1. OBTENER LA BÓVEDA (COLECCIÓN COMPLETA)
   * Llama al método index() del CollectionController en Laravel.
   * Trae todas las cartas que posee el usuario logueado (UserCards) junto con 
   * la información de sus plantillas originales (CardTemplates) gracias al Eager Loading.
   *
   * @returns Un Observable con el inventario completo y detallado del usuario.
   */
  getCollection(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/collection`);
  }

  /**
   * 2. AÑADIR O SUMAR UNA CARTA A LA BÓVEDA
   * Llama al método store() del CollectionController.
   * Si el usuario ya tiene esta carta (misma plantilla y mismo tipo de brillo), Laravel 
   * incrementará la columna 'quantity'. Si no la tiene, creará un nuevo registro.
   *
   * @param cardTemplateId El ID de la plantilla original (CardTemplate) obtenida del catálogo.
   * @param isFoil Booleano opcional para indicar si el usuario guardó la versión brillante (defecto: false).
   * @returns Un Observable con el registro actualizado (UserCard) o recién creado.
   */
  addCard(cardTemplateId: number | string, isFoil: boolean = false): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/collection`, {
      card_template_id: cardTemplateId,
      is_foil: isFoil
    });
  }

  /**
   * 3. QUITAR O RESTAR UNA CARTA DE LA BÓVEDA
   * Llama al método destroy() del CollectionController.
   * Si la carta tiene cantidad > 1, Laravel restará 1 a la columna 'quantity'.
   * Si la cantidad es exactamente 1, Laravel eliminará el registro de la bóveda.
   *
   * @param userCardId El ID único del registro en la bóveda (ID del modelo UserCard, NO de la plantilla).
   * @returns Un Observable con el mensaje de confirmación del borrado o reducción.
   */
  removeCard(userCardId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/collection/${userCardId}`);
  }

  /**
   * 4. OBTENER RESUMEN DE LA BÓVEDA (PROGRESO POR EXPANSIÓN)
   * Llama al método setsSummary() del CollectionController.
   * Calcula el porcentaje de cartas obtenidas por cada set y devuelve
   * estadísticas globales de la colección del usuario para la cabecera.
   *
   * @returns Un Observable con el array de expansiones y estadísticas globales.
   */
  getVaultSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vault/sets-summary`);
  }

  /**
   * 5. OBTENER LAS CARTAS DE LA BÓVEDA (SIN AGRUPAR)
   * Llama al método index() del CollectionController.
   * A diferencia del catálogo, este endpoint devuelve cada variante (p1, r1)
   * como una tarjeta física independiente, filtrada opcionalmente por expansión.
   *
   * @param setId (Opcional) El ID de la expansión para filtrar el inventario.
   * @returns Un Observable con la lista paginada de cartas de la bóveda.
   */
  getVaultCards(setId?: number): Observable<any> {
    // 🚀 FIX TYPE: Creamos un Record estricto para que HttpClient no se queje
    let params: Record<string, string | number> = {};
    
    if (setId) {
      params['set_id'] = setId;
    }
    
    return this.http.get<any>(`${this.apiUrl}/collection`, { params });
  }

  /**
   * 6. ACTUALIZAR CANTIDAD RÁPIDA (STEPPER BÓVEDA)
   * Llama a un endpoint dedicado (PATCH) para sumar o restar cantidades
   * directamente desde el grid de la bóveda, de forma instantánea.
   *
   * @param userCardId El ID único del registro en la bóveda (ID del pivote UserCard).
   * @param increment Booleano: true para sumar 1 copia, false para restar 1 copia.
   * @returns Un Observable con el resultado de la base de datos.
   */
  updateQuantity(userCardId: number, increment: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/collection/${userCardId}/quantity`, {
      action: increment ? 'increment' : 'decrement'
    });
  }

  /**
   * OBTENER CARTAS DE LA WISHLIST
   * Llama al endpoint para traer todas las cartas que el usuario ha marcado como deseadas.
   * Soporta filtrado opcional por expansión (Set).
   *
   * @param setId (Opcional) El ID numérico de la expansión para filtrar los resultados.
   * @returns Un Observable con el array de cartas deseadas formateadas.
   */
  getWishlistCards(setId?: number): Observable<any> {
    let url = `${this.apiUrl}/wishlist`;
    
    if (setId) {
      url += `?set_id=${setId}`;
    }
    
    return this.http.get<any>(url);
  }

  /**
   * AÑADIR CARTA A LA WISHLIST
   * Registra una nueva carta en la lista de deseos del usuario logueado.
   *
   * @param cardTemplateId El ID de la plantilla de la carta (CardTemplate).
   * @returns Un Observable con el mensaje de éxito del backend.
   */
  /* addWishlistCard(cardTemplateId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/wishlist`, {
      card_template_id: cardTemplateId
    });
  } */

  addWishlistCard(cardTemplateId: number): Observable<any> {
  // ✅ ID en la URL, no en el body
    return this.http.post<any>(`${this.apiUrl}/wishlist/${cardTemplateId}`, {});
  }

  /**
   * ELIMINAR CARTA DE LA WISHLIST
   * Borra un registro específico de la lista de deseos del usuario.
   *
   * @param cardTemplateId El ID de la plantilla de la carta (CardTemplate) a eliminar.
   * @returns Un Observable con la confirmación de borrado.
   */
  removeWishlistCard(cardTemplateId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/wishlist/${cardTemplateId}`);
  }
}