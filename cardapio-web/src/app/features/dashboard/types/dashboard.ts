import { StoreInfo } from '../../store-info/types/store';

/** Opção escolhível dentro de um grupo (ex.: "Ovo", "Brioche"). */
export interface Option {
  id: number;
  name: string;
  /** Preço acrescentado ao item por unidade da opção. */
  price: number;
  available: boolean;
}

/**
 * Grupo de opções de um produto (ex.: "Escolha seu Pão", "Adicionais no Lanche").
 *
 * - `single`: escolhe uma opção (radio).
 * - `multiple`: escolhe várias, com quantidade por opção (+ / −).
 * - Obrigatório = `min > 0`.
 */
export interface OptionGroup {
  id: number;
  name: string;
  type: 'single' | 'multiple';
  /** Mínimo de unidades somadas no grupo. 0 = opcional. */
  min: number;
  /** Máximo de unidades somadas no grupo. null = sem limite. */
  max: number | null;
  /** Máximo de unidades de cada opção. null = sem limite. */
  maxPerOption: number | null;
  options: Option[];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  /** Preço base do produto, sem opções. É o valor usado no cálculo do item. */
  price: number;
  /** Quando informado, o cardápio exibe "A partir de {startingPrice}" no lugar do preço. */
  startingPrice: number | null;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
  optionGroups: OptionGroup[];
}

export interface Category {
  id: number;
  name: string;
  products: Product[];
}

export interface Menu {
  store: StoreInfo;
  categories: Category[];
}
