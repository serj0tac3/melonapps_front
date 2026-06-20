import { Component, OnInit, inject, signal, computed, Pipe, PipeTransform, viewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CollectionService } from '../../core/services/collection';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(text: string, search: string): SafeHtml {
    if (!search || !text) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    const highlighted = text.replace(regex, `<mark class="bg-indigo-500/40 text-indigo-100 rounded px-0.5">$1</mark>`);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [RouterLink, HighlightPipe],
  templateUrl: './collection.html',
  styleUrl: './collection.css'
})
export class CollectionComponent implements OnInit {
  private collectionService = inject(CollectionService);

  // Estados con Signals
  activeTab = signal<'collection' | 'wishlist'>('collection');
  activeSet = signal<any>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  searchTerm = signal<string>('');
  isMobileSearchActive = signal<boolean>(false);
  
  summaryStats = signal<any>({});
  setsProgress = signal<any[]>([]);
  myCards = signal<any[]>([]);
  myWishlist = signal<any[]>([]); // 🚀 NUEVO: Array para la wishlist
  isLoading = signal<boolean>(true);

  readonly carousel = viewChild<ElementRef<HTMLDivElement>>('carousel');

  // 🚀 Filtrado Reactivo (Ahora escucha a la pestaña activa)
  filteredCards = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    // Elegimos la fuente de datos según la pestaña
    const cards = this.activeTab() === 'collection' ? this.myCards() : this.myWishlist();
    
    if (!term) return cards;
    return cards.filter(c => c.name.toLowerCase().includes(term) || c.card_number.toLowerCase().includes(term));
  });

  ngOnInit() {
    this.loadSummary();
    this.loadVault();
    this.loadWishlist(); // Cargamos ambas en background al entrar
  }

  loadSummary() {
    this.collectionService.getVaultSummary().subscribe({
      next: (res) => {
        this.setsProgress.set(res.sets);
        this.summaryStats.set(res.stats);
      },
      error: (err) => console.error('Error cargando el resumen:', err)
    });
  }

  loadVault(setId?: number) {
    this.isLoading.set(true);
    this.collectionService.getVaultCards(setId).subscribe({
      next: (response: any) => {
        const cardsArray = response.data ? response.data : response;
        this.myCards.set(cardsArray);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la bóveda:', err);
        this.isLoading.set(false);
      }
    });
  }

  // 🚀 NUEVO: Cargar la Wishlist
  loadWishlist(setId?: number) {
    // IMPORTANTE: Asegúrate de tener getWishlistCards en tu CollectionService
    this.collectionService.getWishlistCards(setId).subscribe({
      next: (response: any) => {
        const cardsArray = response.data ? response.data : response;
        this.myWishlist.set(cardsArray);
      },
      error: (err) => console.error('Error al cargar la wishlist:', err)
    });
  }

  selectSet(set: any) {
    if (this.activeSet()?.id === set.id) {
      this.activeSet.set(null);
      this.activeTab() === 'collection' ? this.loadVault() : this.loadWishlist();
    } else {
      this.activeSet.set(set);
      this.activeTab() === 'collection' ? this.loadVault(set.id) : this.loadWishlist(set.id);
    }
  }

  // 🚀 NUEVO: Al cambiar de pestaña limpiamos la selección de Set
  setTab(tab: 'collection' | 'wishlist') {
    this.activeTab.set(tab);
    this.activeSet.set(null); // Reseteamos el filtro de expansión
    this.searchTerm.set(''); // Limpiamos la búsqueda
    tab === 'collection' ? this.loadVault() : this.loadWishlist();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode.set(mode);
  }

  updateSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleMobileSearch() {
    this.isMobileSearchActive.update(v => !v);
    if (!this.isMobileSearchActive()) {
      this.searchTerm.set(''); 
    }
  }

  scrollCarousel(direction: 'left' | 'right') {
    const el = this.carousel()?.nativeElement;
    if (el) {
      const scrollAmount = 280; 
      el.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  }

  addCopy(card: any) {
    this.collectionService.addCard(card.card_id, false).subscribe({
      next: () => {
        this.myCards.update(cards =>
          cards.map(c => c.user_card_id === card.user_card_id ? { ...c, owned_copies: c.owned_copies + 1 } : c)
        );
      },
      error: (err) => console.error('Error al añadir:', err)
    });
  }

  removeCopy(card: any) {
    this.collectionService.removeCard(card.user_card_id).subscribe({
      next: () => {
        this.myCards.update(cards => {
          if (card.owned_copies > 1) {
            return cards.map(c => c.user_card_id === card.user_card_id ? { ...c, owned_copies: c.owned_copies - 1 } : c);
          } else {
            return cards.filter(c => c.user_card_id !== card.user_card_id);
          }
        });
      },
      error: (err) => console.error('Error al quitar:', err)
    });
  }

  // 🚀 NUEVO: Quitar carta de la Wishlist
  removeFromWishlist(card: any) {
    // IMPORTANTE: Asegúrate de tener removeWishlistCard en tu CollectionService
    this.collectionService.removeWishlistCard(card.card_id).subscribe({
      next: () => {
        this.myWishlist.update(cards => cards.filter(c => c.card_id !== card.card_id));
        // Actualizamos el contador visual rápido
        this.summaryStats.update((stats: any) => ({...stats, wishlist_count: stats.wishlist_count - 1}));
      },
      error: (err) => console.error('Error al quitar de wishlist:', err)
    });
  }

  // 🚀 NUEVO: Mover de Wishlist a Colección (1 click)
  moveToCollection(card: any) {
    this.collectionService.addCard(card.card_id, false).subscribe({
      next: () => {
        this.removeFromWishlist(card); // Si se añade con éxito, se quita de deseados
      },
      error: (err) => console.error('Error al mover a colección:', err)
    });
  }

  getProgressBarColor(percentage: number): string {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 30) return 'bg-amber-400';
    return 'bg-rose-500';
  }
}