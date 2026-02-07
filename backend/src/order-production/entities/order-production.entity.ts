import { ProductionStatus } from 'generated/prisma/client';

export class OrderProductionEntity {
  id: number;
  orderItemId: number;
  productionLocation: string;
  status: ProductionStatus;
  quantityRequested: number;
  quantityProduced: number;
  pendingAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relacionamentos opcionais
  orderItem?: {
    id: number;
    code: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    orderId: number;
    productId: number;
    order?: {
      id: number;
      customerName: string | null;
      table: string | null;
      type: string;
    };
    product?: {
      id: number;
      name: string;
      code: string;
    };
  };

  // Durações calculadas (opcionais)
  pendingDuration?: number | null;
  inProgressDuration?: number | null;
  completedDuration?: number | null;
  totalDuration?: number | null;
}
