export type PaymentType = 'pix' | 'card' | 'cash';

export interface PaymentMethod {
  type: PaymentType;
  label: string;
}
