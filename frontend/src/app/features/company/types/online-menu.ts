export type OnlinePaymentType = 'pix' | 'card' | 'cash';

export interface OnlinePaymentMethod {
  type: OnlinePaymentType;
  label: string;
}

export interface OpeningHour {
  id?: number;
  weekday: number; // 0 = domingo ... 6 = sábado
  opensAt: string; // HH:mm
  closesAt: string; // HH:mm
}

export interface OnlineMenuSettings {
  onlineMenuEnabled: boolean;
  onlineOrdersPaused: boolean;
  timezone: string;
  whatsapp: string | null;
  instagram: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  takeoutTime: number | null;
  deliveryFee: number;
  minOrderValue: number;
  onlinePaymentMethods: OnlinePaymentMethod[];
  openingHours: OpeningHour[];
}

export type OnlineMenuSettingsUpdate = Partial<Omit<OnlineMenuSettings, 'openingHours'>>;
