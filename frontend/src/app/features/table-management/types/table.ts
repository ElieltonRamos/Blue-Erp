export interface TableProduct {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Table {
  id?: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  customer: string | null;
  time: string | null;
  products?: TableProduct[];
}

export interface ProductTable {
  id: number;
  name: string;
  price: number;
  category?: string;
}