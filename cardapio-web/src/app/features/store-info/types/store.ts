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
  phone: string; // exibido: "(38) 99262-7635"
  whatsapp: string; // só dígitos com país: "5538992627635"
  instagram: string | null; // só o usuário: "lacasa_hamburgueria_"
  latitude: number;
  longitude: number;
  hours: StoreHours[];
  paymentMethods: string[];
}
