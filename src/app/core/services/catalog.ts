import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // 🚀 CACHÉS EN MEMORIA: Para un rendimiento extremo y ahorro de peticiones al servidor
  private cache = new Map<string, any[]>();
  private cachedMetadata: any = null;

  /**
   * 1. OBTENER METADATOS DE FILTROS
   * Recupera las listas de colores, rarezas y categorías desde Laravel.
   * Utiliza una caché secundaria en memoria RAM para no repetir la petición 
   * física a la API cada vez que el componente se destruye y reconstruye.
   *
   * @returns Un Observable con la estructura de filtros lista para usar en la UI.
   */
  getFilterMetadata(): Observable<any> {
    if (this.cachedMetadata) {
      return of({ data: this.cachedMetadata }); 
    }
    return this.http.get<any>(`${this.apiUrl}/cards/filters`).pipe(
      tap(response => {
        this.cachedMetadata = response.data ? response.data : response;
      })
    );
  }

  /**
   * 2. OBTENER CATÁLOGO (Con Paginación, Spatie y Caché Inteligente)
   * Pide las cartas al backend o las devuelve en 0ms desde la RAM si 
   * esa combinación de filtros y página ya fue consultada previamente.
   *
   * @param params Objeto dinámico que puede contener la página actual y filtros (ej: { page: 1, 'filter[color]': 'red' }).
   * @returns Un Observable con la lista de cartas paginadas.
   */
  getCards(params: any = {}): Observable<any> {
    // Creamos una "huella dactilar" única basada en los parámetros
    const cacheKey = JSON.stringify(params);

    if (this.cache.has(cacheKey)) {
      return of({ data: this.cache.get(cacheKey) }); 
    }

    return this.http.get<any>(`${this.apiUrl}/cards`, { params }).pipe(
      tap(response => {
        // Extracción agnóstica de los datos sin importar la envoltura de paginación de Laravel
        let cardsToCache = [];
        if (Array.isArray(response)) cardsToCache = response;
        else if (response.data && Array.isArray(response.data)) cardsToCache = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) cardsToCache = response.data.data;
        
        // Guardamos los resultados bajo su huella dactilar
        this.cache.set(cacheKey, cardsToCache);
      })
    );
  }

  /**
   * 3. OBTENER CARTA INDIVIDUAL
   * Consulta directa al servidor para traer el detalle siempre fresco.
   *
   * @param id El identificador de la plantilla original (CardTemplate).
   * @returns Un Observable con los detalles completos de la carta.
   */
  getCardById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cards/${id}`);
  }
}