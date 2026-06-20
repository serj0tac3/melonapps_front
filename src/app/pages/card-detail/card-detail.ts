import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CatalogService } from '../../core/services/catalog';
import { CollectionService } from '../../core/services/collection';
import { Card } from '../../shared/models/card.interface';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  templateUrl: './card-detail.html'
})
export class CardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private catalogService = inject(CatalogService);
  private collectionService = inject(CollectionService);
  private toastService = inject(ToastService);

  card = signal<Card | null>(null);
  activeVariant = signal<Card | null>(null);
  relatedCards = signal<Card[]>([]);
  
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.loadCard(id);
    });
  }

  loadCard(id: string) {
    this.isLoading.set(true);
    this.catalogService.getCardById(id).subscribe({
      next: (response: any) => {
        const cardData = response.data ? response.data : response;
        this.card.set(cardData);
        this.activeVariant.set(cardData);
        this.loadRelatedCards(cardData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando la carta:', err);
        this.isLoading.set(false);
      }
    });
  }

  // 🚀 Trae cartas relacionadas usando la caché de tu CatalogService
  loadRelatedCards(mainCard: Card) {
    if (!mainCard.color) return;
    
    // Buscamos cartas del mismo color para sugerir abajo
    this.catalogService.getCards({ 'filter[color]': mainCard.color, page: 1 }).subscribe({
      next: (response: any) => {
        let cards = [];
        if (Array.isArray(response)) cards = response;
        else if (response.data && Array.isArray(response.data)) cards = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) cards = response.data.data;
        
        // Filtramos para no mostrar la carta actual y nos quedamos con 4
        const filtered = cards.filter((c: Card) => c.card_number !== mainCard.card_number).slice(0, 4);
        this.relatedCards.set(filtered);
      }
    });
  }

  // 🚀 Cambia la variante y actualiza la URL silenciosamente
  selectVariant(variant: Card) {
    this.activeVariant.set(variant);
    this.location.replaceState(`/card/${variant.unique_id}`);
  }

  goBack() {
    this.location.back();
  }

  // 🚀 Gestión de Bóveda
  addCopy() {
    const current = this.activeVariant();
    if (!current) return;
    this.isSaving.set(true);

    this.collectionService.addCard(current.id, false).subscribe({
      next: (res) => {
        current.owned_copies = (current.owned_copies || 0) + 1;
        // Si el backend devuelve el ID del pivote nuevo, lo guardamos
        if (res.data && res.data.id) current.user_card_id = res.data.id;
        this.toastService.success('Añadida', `+1 copia de ${current.name}.`);
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo guardar la copia.');
        this.isSaving.set(false);
      }
    });
  }

  removeCopy() {
    const current = this.activeVariant();
    if (!current || !current.owned_copies || !current.user_card_id) return;
    this.isSaving.set(true);

    this.collectionService.removeCard(current.user_card_id).subscribe({
      next: () => {
        current.owned_copies = current.owned_copies! - 1;
        this.toastService.info('Restada', `-1 copia de ${current.name}.`);
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo quitar la copia.');
        this.isSaving.set(false);
      }
    });
  }

  addToWishlist() {
    const current = this.activeVariant();
    if (!current) return;
    
    this.isSaving.set(true);
    this.collectionService.addWishlistCard(current.id).subscribe({
      next: () => {
        this.toastService.success('Wishlist', `${current.name} añadida a deseados.`);
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo añadir a deseados.');
        this.isSaving.set(false);
      }
    });
  }

  getVariantSuffix(uniqueId?: string): string {
    if (!uniqueId) return 'p1';
    
    const parts = uniqueId.split('_');
    return parts.length > 1 ? parts[1] : 'p1';
  }
}