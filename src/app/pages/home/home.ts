import { Component, inject, signal, HostListener, computed } from '@angular/core';
import { CatalogService } from '../../core/services/catalog';
import { CardItemComponent } from '../../shared/components/card-item/card-item';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar'; // 🚀 IMPORTAMOS EL COMPONENTE HIJO
import { Card } from '../../shared/models/card.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardItemComponent, SearchBarComponent], // 🚀 LO REGISTRAMOS AQUÍ
  templateUrl: './home.html'
})
export class HomeComponent {
  private catalogService = inject(CatalogService);
  
  // Estados reactivos
  cards = signal<Card[]>([]);
  currentPage = 1;
  isLoading = signal<boolean>(false);
  hasMoreCards = signal<boolean>(true);
  
  // Cambia currentSearchTerm = signal<string>(''); por esto:
  currentFilters = signal<any>({});

  private pendingRequest?: Subscription;

  // 🚀 Computed property que genera los chips visuales
  activeFilterChips = computed(() => {
    const current = this.currentFilters();
    const chips: { key: string, label: string }[] = [];
    
    if (current.search) chips.push({ key: 'search', label: `"${current.search}"` });
    if (current.color) chips.push({ key: 'color', label: `Color: ${current.color}` });
    if (current.category) chips.push({ key: 'category', label: `Tipo: ${current.category}` });
    if (current.rarity) chips.push({ key: 'rarity', label: `Rareza: ${current.rarity}` });
    
    return chips;
  });

  // 🚀 Función para eliminar un chip individualmente
  removeFilter(key: string) {
    const current = { ...this.currentFilters() };
    delete current[key];
    // Re-dispara la búsqueda sin ese filtro
    this.onSearchChange(current);
  }

  constructor() {
    this.loadFeaturedCards();
  }

  // Ahora recibimos un objeto entero, no un string
  onSearchChange(filters: any) {
    if (this.pendingRequest) this.pendingRequest.unsubscribe();
    
    this.currentFilters.set(filters); // Guardamos todos los filtros
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

    // 🚀 MAGIA DE SPATIE: Añadimos dinámicamente los filtros que estén seleccionados
    if (filters.search) params['filter[search]'] = filters.search;
    if (filters.color) params['filter[color]'] = filters.color;
    if (filters.category) params['filter[category]'] = filters.category;
    if (filters.rarity) params['filter[rarity]'] = filters.rarity;

    this.pendingRequest = this.catalogService.getCards(params).subscribe({
      next: (response: any) => {
        // ... (el extractor se queda exactamente igual) ...
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

  // Detecta el scroll de la ventana
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.innerHeight + window.scrollY;

    if (scrollPosition >= scrollHeight - 400) {
      if (!this.isLoading() && this.hasMoreCards()) {
        this.currentPage++;
        this.loadFeaturedCards();
      }
    }
  }
}