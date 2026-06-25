import { Component, OnInit, inject, signal, computed, Pipe, PipeTransform, viewChild, ElementRef, HostListener } from '@angular/core';
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

  activeTab = signal<'collection' | 'wishlist'>('collection');
  activeSet = signal<any>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  searchTerm = signal<string>('');
  isMobileSearchActive = signal<boolean>(false);
  
  summaryStats = signal<any>({});
  setsProgress = signal<any[]>([]);
  myCards = signal<any[]>([]);
  myWishlist = signal<any[]>([]);
  
  // 🚀 NUEVOS ESTADOS DE PAGINACIÓN
  isLoading = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);
  currentPage = signal<number>(1);
  hasMoreCards = signal<boolean>(true);

  readonly carousel = viewChild<ElementRef<HTMLDivElement>>('carousel');

  filteredCards = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const cards = this.activeTab() === 'collection' ? this.myCards() : this.myWishlist();
    
    if (!term) return cards;
    return cards.filter(c => c.name.toLowerCase().includes(term) || c.card_number.toLowerCase().includes(term));
  });

  ngOnInit() {
    this.loadSummary();
    this.loadVault();
    this.loadWishlist(); 
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

  // 🚀 ADAPTADO: Paginación en Bóveda
  loadVault(setId?: number, page: number = 1) {
    if (page === 1) this.isLoading.set(true);
    else this.isLoadingMore.set(true);

    this.collectionService.getVaultCards(setId, page).subscribe({
      next: (response: any) => {
        let newCards = [];
        if (Array.isArray(response)) newCards = response;
        else if (response.data && Array.isArray(response.data)) newCards = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) newCards = response.data.data;

        if (newCards.length === 0) {
          this.hasMoreCards.set(false);
        } else {
          if (page === 1) this.myCards.set(newCards);
          else this.myCards.update(cards => [...cards, ...newCards]);
        }
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la bóveda:', err);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  // 🚀 ADAPTADO: Paginación en Wishlist
  loadWishlist(setId?: number, page: number = 1) {
    if (page === 1 && this.activeTab() === 'wishlist') this.isLoading.set(true);
    else if (page > 1) this.isLoadingMore.set(true);

    this.collectionService.getWishlistCards(setId, page).subscribe({
      next: (response: any) => {
        let newCards = [];
        if (Array.isArray(response)) newCards = response;
        else if (response.data && Array.isArray(response.data)) newCards = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) newCards = response.data.data;

        if (newCards.length === 0) {
          this.hasMoreCards.set(false);
        } else {
          if (page === 1) this.myWishlist.set(newCards);
          else this.myWishlist.update(cards => [...cards, ...newCards]);
        }
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        console.error('Error al cargar la wishlist:', err);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  // 🚀 NUEVO: Scroll infinito
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.innerHeight + window.scrollY;

    // Si baja a menos de 400px del fondo, pedimos más
    if (scrollPosition >= scrollHeight - 400) {
      if (!this.isLoading() && !this.isLoadingMore() && this.hasMoreCards()) {
        this.currentPage.update(p => p + 1);
        const currentSetId = this.activeSet()?.id;
        
        if (this.activeTab() === 'collection') {
          this.loadVault(currentSetId, this.currentPage());
        } else {
          this.loadWishlist(currentSetId, this.currentPage());
        }
      }
    }
  }

  // 🚀 ADAPTADO: Resetear paginación al cambiar filtros
  selectSet(set: any) {
    this.currentPage.set(1);
    this.hasMoreCards.set(true);
    
    if (this.activeSet()?.id === set.id) {
      this.activeSet.set(null);
      this.activeTab() === 'collection' ? this.loadVault() : this.loadWishlist();
    } else {
      this.activeSet.set(set);
      this.activeTab() === 'collection' ? this.loadVault(set.id) : this.loadWishlist(set.id);
    }
  }

  setTab(tab: 'collection' | 'wishlist') {
    this.activeTab.set(tab);
    this.activeSet.set(null); 
    this.searchTerm.set(''); 
    this.currentPage.set(1);
    this.hasMoreCards.set(true);
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

  removeFromWishlist(card: any) {
    this.collectionService.removeWishlistCard(card.card_id).subscribe({
      next: () => {
        this.myWishlist.update(cards => cards.filter(c => c.card_id !== card.card_id));
        this.summaryStats.update((stats: any) => ({...stats, wishlist_count: stats.wishlist_count - 1}));
      },
      error: (err) => console.error('Error al quitar de wishlist:', err)
    });
  }

  moveToCollection(card: any) {
    this.collectionService.addCard(card.card_id, false).subscribe({
      next: () => {
        this.removeFromWishlist(card); 
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