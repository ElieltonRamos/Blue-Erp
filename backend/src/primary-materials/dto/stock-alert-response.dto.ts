import { Unit } from 'generated/prisma/client';

export class StockAlertResponseDto {
  id: string;
  name: string;
  code: string;
  unit: Unit;
  currentStock: number;
  minStock?: number; // Se você adicionar este campo no schema
  unitCost: number;
  estimatedValue: number; // currentStock * unitCost
}
