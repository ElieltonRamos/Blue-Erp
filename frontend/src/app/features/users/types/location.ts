export interface ProductionLocation {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}
