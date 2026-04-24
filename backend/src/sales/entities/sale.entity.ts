export class SaleItemEntity {
  id!: number;
  itemNumber!: number;
  saleId!: number;
  productId!: number;
  xProd!: string | null;
  quantity!: number;
  unitPrice!: number;
  totalPrice!: number;
  taxUnit!: string | null;
  taxQuantity!: number | null;
  taxUnitPrice!: number | null;
  composesTotal!: number;
  cfop!: string | null;
  totalTaxValue!: number | null;
  importTaxValue!: number | null;
  iofValue!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class SalePaymentEntity {
  id!: number;
  saleId!: number;
  method!: string;
  amount!: number;
  change!: number;
  createdAt!: Date;
}

export class SaleEntity {
  id!: number;
  clientId!: number;
  userOperator!: string;
  operatorId!: number | null;
  date!: Date;
  payments!: SalePaymentEntity[];
  totalProductsWithoutDiscount!: number;
  discount!: number;
  total!: number;
  profitSale!: number;
  isPaid!: boolean;
  cfop!: string;
  fiscalStatus!: string;
  fiscalKey!: string | null;
  fiscalProtocol!: string | null;
  fiscalEmitDate!: Date | null;
  fiscalXml!: string | null;
  createdAt!: Date;
  serviceCharge!: number;
  updatedAt!: Date;
  items!: SaleItemEntity[];
}
