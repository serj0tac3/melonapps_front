import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Card } from '../../models/card.interface';
import { ToastService } from '../../../core/services/toast';

// 🚀 1. Importamos el servicio real de la Bóveda (Verifica la ruta si es distinta)
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

  private toastService = inject(ToastService);
  
  // 🚀 2. Inyectamos el servicio real
  private collectionService = inject(CollectionService); 

  ngOnInit() {
    this.activeVariant.set(this.card);
  }

  selectVariant(variant: Card) {
    this.activeVariant.set(variant);
  }

  quickAdd(event: Event) {
    event.stopPropagation(); 
    event.preventDefault();
    
    const current = this.activeVariant();
    this.isAdding.set(true);

    // 🚀 3. LLAMADA REAL A TU BACKEND (LARAVEL)
    this.collectionService.addCard(current.id, false).subscribe({
      next: () => {
        // Actualizamos visualmente el frontend
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

  isWishlisting = signal<boolean>(false);

  toggleWishlist(event: Event) {
    event.stopPropagation(); 
    event.preventDefault();
    
    const current = this.activeVariant();
    this.isWishlisting.set(true);

    if (current.is_wishlisted) {
      // 💔 Si ya la deseaba, la quitamos
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
      // ❤️ Si no la deseaba, la añadimos
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