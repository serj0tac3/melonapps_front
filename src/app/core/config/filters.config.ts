// Aquí definimos los filtros específicos para One Piece. 
// Mañana, aquí mismo añadiremos POKEMON_FILTERS, MAGIC_FILTERS, etc.

export const ONE_PIECE_FILTERS = {
  colors: [
    { value: 'Red', label: 'Rojo' },
    { value: 'Green', label: 'Verde' },
    { value: 'Blue', label: 'Azul' },
    { value: 'Purple', label: 'Morado' },
    { value: 'Black', label: 'Negro' },
    { value: 'Yellow', label: 'Amarillo' }
  ],
  categories: [
    { value: 'LEADER', label: 'Líder' },
    { value: 'CHARACTER', label: 'Personaje' },
    { value: 'EVENT', label: 'Evento' },
    { value: 'STAGE', label: 'Escenario' }
  ],
  rarities: [
    { value: 'L', label: 'Leader (L)' },
    { value: 'C', label: 'Common (C)' },
    { value: 'UC', label: 'Uncommon (UC)' },
    { value: 'R', label: 'Rare (R)' },
    { value: 'SR', label: 'Super Rare (SR)' },
    { value: 'SEC', label: 'Secret (SEC)' }
  ]
};