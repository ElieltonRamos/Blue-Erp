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
  phone: string;
  whatsapp: string;
  instagram: string | null;
  latitude: number;
  longitude: number;
  hours: StoreHours[];
  paymentMethods: PaymentMethod[];
}
