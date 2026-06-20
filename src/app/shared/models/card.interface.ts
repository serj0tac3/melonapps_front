export interface Card {
  id: number;
  name: string;
  card_number: string;
  unique_id?: string;
  image_url: string;
  attributes?: any; // Usamos 'any' porque el JSON es dinámico (HP, Color, Ink...)
  
  // 🚀 PROPIEDADES QUE LARAVEL NOS MANDA APLANADAS:
  category?: string;
  color?: string;
  cost?: number | string;
  power?: number | string;
  counter?: number | string; // 🚀 NUEVO: Para el valor de contraataque
  feature?: string;          // 🚀 NUEVO: Atributo o Facción (ej: Straw Hat Crew)
  rarity?: string;
  effect?: string;
  life?: number | string;

  // Datos que inyecta nuestra API
  set_name?: string;
  set_code?: string;
  set_total?: number;
  market_price?: number | null;
  line_value?: number | null; // Para el cálculo de la bóveda

  // Datos de usuario y relaciones
  owned_copies?: number; 
  user_card_id?: number; // 🚀 NUEVO: ID del pivote (UserCard) para poder borrar copias
  variants?: Card[];     // Para el selector de puntitos y variantes del detalle
  is_wishlisted?: boolean;
}