// types/purchase.ts

export type PurchaseStatus = 'RECEIVED' | 'CANCELED';

export interface BusinessPartner {
  id: number;
  type: 'SUPPLIER' | 'EMPLOYEE' | 'CARRIER' | 'ACCOUNTANT' | 'BANK';
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
}

export interface ParsedNfeItem {
  supplierProductCode: string;
  description: string;
  ncm: string;
  unit: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface ParsedNfeInstallment {
  number: string;
  dueDate: string;
  value: number;
}

export interface ReconciledPurchaseItem {
  supplierProductCode: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
  productId?: number;
  materialId?: number;
}

// Retorno de POST /purchases/parse-xml
export interface ParsedPurchasePreview {
  supplierCnpj: string;
  supplierName: string;
  destCnpj: string;
  invoiceNumber: string;
  fiscalKey: string;
  fiscalXml: string;
  items: ReconciledPurchaseItem[];
  installments: ParsedNfeInstallment[];
  totalValue: number;
}

// Payload de POST /purchases
export interface CreatePurchaseFromXml {
  supplierCnpj: string;
  supplierName: string;
  destCnpj: string;
  invoiceNumber: string;
  fiscalKey: string;
  fiscalXml: string;
  items: ReconciledPurchaseItem[];
  installments: ParsedNfeInstallment[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId?: number;
  materialId?: number;
  supplierProductCode?: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: number;
  status: PurchaseStatus;
  supplierId: number;
  supplier?: BusinessPartner;
  total: number;
  invoiceNumber?: string;
  fiscalKey?: string;
  supplierCnpj?: string;
  receivedAt: string;
  items: PurchaseItem[];
  expenses: Expense[];
}

// Reaproveitado do módulo financeiro
export interface Expense {
  id: number;
  supplier: string;
  description?: string;
  value: number;
  datePayment: string;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  purchaseId?: number;
  partnerId?: number;
}

export interface PurchaseFilters {
  status?: PurchaseStatus | '';
  supplier?: string;
}
