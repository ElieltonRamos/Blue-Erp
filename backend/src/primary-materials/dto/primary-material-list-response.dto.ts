import { Unit } from 'generated/prisma/client';

export class PrimaryMaterialResponseDto {
  id: string;
  name: string;
  code: string;
  unit: Unit;
  unitCost: number;
  currentStock: number;
  active: boolean;
  ncm?: string | null;
  cfop?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
