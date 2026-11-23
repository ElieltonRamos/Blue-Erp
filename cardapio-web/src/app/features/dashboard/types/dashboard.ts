import { StoreInfo } from "../../store-info/types/store";

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  /** Quando true, exibe "A partir de" antes do preço. */
  priceFrom?: boolean;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
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
