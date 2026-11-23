import { Product } from "../../dashboard/types/dashboard";

export interface CartItem {
  product: Product;
  quantity: number;
  observation: string;
}
