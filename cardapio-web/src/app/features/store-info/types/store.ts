import { PaymentMethod } from '../../checkout/types/checkout';

export interface StoreHours {
  day: string;
  open: string;
  close: string;
}

export interface StoreInfo {
  name: string;
  address: string;
  openingHours: string;
  isOpen: boolean;
  deliveryTime: string;
  takeoutTime: string;
  /** Taxa de entrega fixa. */
  deliveryFee: number;
  /** Valor mínimo dos itens para pedidos de entrega. 0 = sem mínimo. */
  minOrderValue: number;
  /** Logo da loja (favicon e identidade). */
  logoUrl: string | null;
  phone: string;
  whatsapp: string;
  instagram: string | null;
  latitude: number;
  longitude: number;
  hours: StoreHours[];
  paymentMethods: PaymentMethod[];
}
