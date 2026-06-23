export interface CardSet {
  id: number;
  game_id: number;
  name: string;
  short_name?: string;
  code: string;
  total_cards: number;
  family?: string;
  progress?: number;
  release_date?: string;
  image_url?: string;
}