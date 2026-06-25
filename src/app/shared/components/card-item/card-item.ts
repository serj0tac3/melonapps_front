import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Card } from '../../models/card.interface';
import { ToastService } from '../../../core/services/toast';
import { CollectionService } from '../../../core/services/collection';

@Component({
  selector: 'app-card-item',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './card-item.html'
})
export class CardItemComponent implements OnInit {
  @Input({ required: true }) card!: Card;
  
  activeVariant = signal<Card>({} as Card);
  isAdding = signal<boolean>(false);
  isWishlisting = signal<boolean>(false);

  // 🚀 Variables para el Swipe Nativo
  private touchStartX = 0;
  private touchEndX = 0;

  private toastService = inject(ToastService);
  private collectionService = inject(CollectionService); 

  ngOnInit() {
    this.activeVariant.set(this.card);
  }

  selectVariant(variant: Card) {
    this.activeVariant.set(variant);
  }

  // 🚀 Lógica para detectar el deslizamiento del dedo
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    if (!this.card.variants || this.card.variants.length <= 1) return;

    const swipeThreshold = 50; // Píxeles mínimos para que cuente como deslizamiento
    const diff = this.touchStartX - this.touchEndX;

    if (diff > swipeThreshold) {
      // Swipe hacia la izquierda (Ver siguiente)
      this.nextVariant();
    } else if (diff < -swipeThreshold) {
      // Swipe hacia la derecha (Ver anterior)
      this.prevVariant();
    }
  }

  // 🚀 Hemos hecho el 'event' opcional para poder llamarlo desde el swipe
  prevVariant(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.card.variants || this.card.variants.length <= 1) return;

    const currentIndex = this.card.variants.findIndex(v => v.unique_id === this.activeVariant().unique_id);
    const prevIndex = currentIndex <= 0 ? this.card.variants.length - 1 : currentIndex - 1;
    this.activeVariant.set(this.card.variants[prevIndex]);
  }

  nextVariant(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.card.variants || this.card.variants.length <= 1) return;

    const currentIndex = this.card.variants.findIndex(v => v.unique_id === this.activeVariant().unique_id);
    const nextIndex = currentIndex >= this.card.variants.length - 1 ? 0 : currentIndex + 1;
    this.activeVariant.set(this.card.variants[nextIndex]);
  }

  quickAdd(event: Event) {
    event.stopPropagation(); 
    event.preventDefault();
    
    const current = this.activeVariant();
    this.isAdding.set(true);

    this.collectionService.addCard(current.id, false).subscribe({
      next: () => {
        current.owned_copies = (current.owned_copies || 0) + 1;
        this.toastService.success('¡Añadida!', `1x ${current.name} a tu Bóveda.`);
        this.isAdding.set(false);
      },
      error: (err) => {
        console.error('Error al guardar en la bóveda:', err);
        this.toastService.error('Error', 'No se pudo guardar la carta.');
        this.isAdding.set(false);
      }
    });
  }

  toggleWishlist(event: Event) {
    event.stopPropagation(); 
    event.preventDefault();
    
    const current = this.activeVariant();
    this.isWishlisting.set(true);

    if (current.is_wishlisted) {
      this.collectionService.removeWishlistCard(current.id).subscribe({
        next: () => {
          current.is_wishlisted = false;
          this.toastService.info('Wishlist', `${current.name} eliminada de deseados.`);
          this.isWishlisting.set(false);
        },
        error: () => {
          this.toastService.error('Error', 'No se pudo quitar de deseados.');
          this.isWishlisting.set(false);
        }
      });
    } else {
      this.collectionService.addWishlistCard(current.id).subscribe({
        next: () => {
          current.is_wishlisted = true;
          this.toastService.success('Deseada', `${current.name} a tu Wishlist.`);
          this.isWishlisting.set(false);
        },
        error: () => {
          this.toastService.error('Error', 'No se pudo guardar la carta.');
          this.isWishlisting.set(false);
        }
      });
    }
  }
}