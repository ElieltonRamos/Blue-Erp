export class Ibpt {
  id?: number;
  ncm: string;
  federalTaxRate: number; // Mudou de aliqFederal
  stateTaxRate: number; // Mudou de aliqEstadual
  municipalTaxRate: number; // Mudou de aliqMunicipal
  version: string;
  createdAt?: Date;
  updatedAt?: Date;
}
