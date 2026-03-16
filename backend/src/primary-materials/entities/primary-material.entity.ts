import { Unit } from 'generated/prisma/client';

export class PrimaryMaterial {
  id: string;
  name: string;
  code: string;
  unit: Unit;
  unitCost: number;
  currentStock: number;
  minStock?: number;
  expiryDate?: Date;
  active: boolean;
  ncm?: string | null;
  cfop?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
