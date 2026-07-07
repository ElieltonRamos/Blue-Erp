// types/auto-closed-order.ts
export interface AutoClosedOrder {
  id: number;
  locationId: string;
  table: string | null;
  customerName: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
}
