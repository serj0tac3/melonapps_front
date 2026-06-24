import { Component, inject, signal, HostListener, computed } from '@angular/core';
import { CatalogService } from '../../core/services/catalog';
import { CardItemComponent } from '../../shared/components/card-item/card-item';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar'; 
import { SetSelectorComponent } from '../../shared/components/set-selector/set-selector'; 
import { Card } from '../../shared/models/card.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardItemComponent, SearchBarComponent, SetSelectorComponent], 
  templateUrl: './home.html'
})
export class HomeComponent {
  private catalogService = inject(CatalogService);
  
  cards = signal<Card[]>([]);
  currentPage = 1;
  isLoading = signal<boolean>(false);
  hasMoreCards = signal<boolean>(true);
  currentFilters = signal<any>({});
  
  selectedSet = signal<any>(null); 
  
  // 🚀 NUEVO ESTADO: Controla si el panel lateral está abierto o cerrado
  isSetSelectorOpen = signal<boolean>(false);
  // 🚀 NUEVO ESTADO: Controla si el botón de subir es visible
  showScrollTopButton = signal<boolean>(false);

  private pendingRequest?: Subscription;

  activeFilterChips = computed(() => {
    const current = this.currentFilters();
    const chips: { key: string, label: string }[] = [];
    
    if (current.search) chips.push({ key: 'search', label: `"${current.search}"` });
    if (current.color) chips.push({ key: 'color', label: `Color: ${current.color}` });
    if (current.category) chips.push({ key: 'category', label: `Tipo: ${current.category}` });
    if (current.rarity) chips.push({ key: 'rarity', label: `Rareza: ${current.rarity}` });
    
    if (current.set_code) chips.push({ key: 'set_code', label: `Set: ${current.set_code}` });
    
    return chips;
  });

  removeFilter(key: string) {
    const current = { ...this.currentFilters() };
    delete current[key];
    
    if (key === 'set_code') {
      this.selectedSet.set(null);
    }
    
    this.onSearchChange(current);
  }

  constructor() {
    this.loadFeaturedCards();
  }

  // 🚀 ACTUALIZADO: Guardamos el ID para el Backend y el Code para el UI
  onSetSelected(set: any) {
    const current = { ...this.currentFilters() };
    if (set) {
      current.set_code = set.code; 
      current.set_id = set.id;     // <-- Añadimos el ID real de la base de datos
    } else {
      delete current.set_code; 
      delete current.set_id;       // <-- Lo borramos si deselecciona
    }
    
    this.isSetSelectorOpen.set(false);
    this.onSearchChange(current);
  }

  onSearchChange(filters: any) {
    if (this.pendingRequest) this.pendingRequest.unsubscribe();
    
    this.currentFilters.set(filters); 
    this.currentPage = 1;
    this.cards.set([]);               
    this.hasMoreCards.set(true);      
    this.isLoading.set(false);
    
    this.loadFeaturedCards();
  }

  loadFeaturedCards() {
    if (this.isLoading() || !this.hasMoreCards()) return;
    this.isLoading.set(true);

    const params: any = { page: this.currentPage };
    const filters = this.currentFilters();

    if (filters.search) params['filter[search]'] = filters.search;
    if (filters.color) params['filter[color]'] = filters.color;
    if (filters.category) params['filter[category]'] = filters.category;
    if (filters.rarity) params['filter[rarity]'] = filters.rarity;
    
    // 🚀 NUEVO: Filtramos mandando el ID exacto a la API
    if (filters.set_id) {
      params['filter[card_set_id]'] = filters.set_id; 
    }

    this.pendingRequest = this.catalogService.getCards(params).subscribe({
      next: (response: any) => {
        let newCards = [];
        if (Array.isArray(response)) newCards = response;
        else if (response.data && Array.isArray(response.data)) newCards = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) newCards = response.data.data;

        if (newCards.length === 0) {
          this.hasMoreCards.set(false);
        } else {
          this.cards.update(currentCards => [...currentCards, ...newCards]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cartas:', err);
        this.isLoading.set(false);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.innerHeight + window.scrollY;

    // Lógica existente para cargar más cartas (Scroll infinito)
    if (scrollPosition >= scrollHeight - 400) {
      if (!this.isLoading() && this.hasMoreCards()) {
        this.currentPage++;
        this.loadFeaturedCards();
      }
    }

    // 🚀 NUEVA LÓGICA: Mostrar/ocultar el botón de subir
    if (window.scrollY > 400) {
      this.showScrollTopButton.set(true);
    } else {
      this.showScrollTopButton.set(false);
    }
  }

  // 🚀 NUEVA FUNCIÓN: Vuelve arriba con animación suave
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}