import { Component, inject, signal, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { GameService } from '../../../core/services/game'; // Ajusta la ruta si es necesario
import { Game } from '../../models/game.interface';
import { CardSet } from '../../models/set.interface';

interface GroupedSets {
  familyName: string;
  sets: CardSet[];
}

@Component({
  selector: 'app-set-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './set-selector.html'
})
export class SetSelectorComponent {
  private http = inject(HttpClient);
  private gameService = inject(GameService);
  private apiUrl = environment.apiUrl;

  // 🚀 ESTADOS REACTIVOS (Angular 18)
  // Usamos model() para permitir [(selectedSet)]="miSet" desde el padre
  selectedSet = model<CardSet | null>(null);
  
  activeGameId = signal<number>(1); // Por defecto el juego 1 (ej. One Piece)
  searchTerm = signal<string>('');

  // 🚀 OBTENER JUEGOS
  games = toSignal(this.gameService.getGames(), { initialValue: [] as Game[] });

  // 🚀 OBTENER SETS (Reactivo: se dispara solo si cambia activeGameId)
  private rawSets = toSignal(
    toObservable(this.activeGameId).pipe(
      switchMap(gameId => this.http.get<any>(`${this.apiUrl}/sets?filter[game_id]=${gameId}`)),
      map(response => response.data || response) // Depende de si usas .data de Resource
    ),
    { initialValue: [] as CardSet[] }
  );

  // 🚀 COMPUTADO: Filtra por búsqueda y agrupa por familia instantáneamente
  groupedSets = computed<GroupedSets[]>(() => {
    const term = this.searchTerm().toLowerCase();
    const sets: CardSet[] = this.rawSets();

    // 1. Filtrar
    const filtered = sets.filter(set => 
      set.name.toLowerCase().includes(term) || 
      set.code.toLowerCase().includes(term)
    );

    // 2. Agrupar por familia mapeando el código a un nombre legible
    const groupsMap = new Map<string, CardSet[]>();
    
    for (const set of filtered) {
      const familyName = this.mapFamilyName(set.family);
      if (!groupsMap.has(familyName)) groupsMap.set(familyName, []);
      groupsMap.get(familyName)!.push(set);
    }

    // 3. Convertir a array para iterar fácil en HTML
    return Array.from(groupsMap.entries()).map(([familyName, sets]) => ({
      familyName,
      sets
    }));
  });

  // Evento al hacer clic en un Set
  selectSet(set: CardSet) {
    this.selectedSet.set(set);
  }

  // Evento al cambiar de pestaña
  selectGame(gameId: number) {
    this.activeGameId.set(gameId);
    this.searchTerm.set(''); // Vaciamos el buscador al cambiar de juego
    this.selectedSet.set(null); // Reseteamos el set seleccionado (opcional)
  }

  // Helper para mapear "EB" a "Premium Boosters"
  private mapFamilyName(familyCode?: string): string {
    switch (familyCode?.toUpperCase()) {
      case 'EB': return 'PREMIUM BOOSTERS';
      case 'OP': return 'BOOSTER PACKS';
      case 'ST': return 'STARTER DECKS';
      default: return 'OTROS';
    }
  }
}