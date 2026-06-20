import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Game } from '../../shared/models/game.interface';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * 1. OBTENER LISTA DE JUEGOS (TCGs)
   * Consulta a la API de Laravel para obtener todos los juegos de cartas
   * soportados por la plataforma (ej: Magic, Pokémon, Lorcana, etc.).
   *
   * @returns Un Observable que emite un array de objetos Game.
   */
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games`);
  }

  /**
   * 2. OBTENER DETALLE DE UN JUEGO ESPECÍFICO
   * Recupera toda la información asociada a un juego concreto utilizando
   * su identificador amigable en la URL (slug). Muy útil para cargar
   * la página principal de un juego y ver sus expansiones (sets).
   *
   * @param slug El identificador único del juego en formato texto (ej: 'magic-the-gathering').
   * @returns Un Observable con los datos detallados del juego solicitado.
   */
  getGame(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/${slug}`);
  }
}