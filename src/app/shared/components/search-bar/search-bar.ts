import { Component, output, signal, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog'; // 🚀 Inyectamos tu servicio

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.html'
})
export class SearchBarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogService = inject(CatalogService); // 🚀 Inyección de dependencia
  
  // Estado reactivo que guardará los filtros que vengan de Laravel de forma dinámica
  activeFilters = signal<any>(null);

  filterForm: FormGroup = this.fb.group({
    search: [''],
    color: [''],
    rarity: [''],
    category: ['']
  });

  filtersChanged = output<any>();
  isFiltersOpen = signal<boolean>(false);

  ngOnInit() {
    // 🚀 1. Petición al Backend para obtener la configuración de filtros actual
    this.catalogService.getFilterMetadata().subscribe({
      next: (response: any) => {
        // Adaptamos la lectura según si tu interceptor devuelve la respuesta cruda o limpia
        const metadata = response.data ? response.data : response;
        this.activeFilters.set(metadata);
      },
      error: (err) => {
        console.error('Error cargando los metadatos de filtrado:', err);
      }
    });

    // 2. Escucha reactiva a los cambios que haga el usuario en la UI
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(values => {
      this.filtersChanged.emit(values);
    });
  }

  toggleFilters() {
    this.isFiltersOpen.update(val => !val);
  }

  resetFilters() {
    this.filterForm.reset({ search: '', color: '', rarity: '', category: '' });
  }
}