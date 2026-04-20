export interface PrintItem {
  name: string;
  quantity: number;
  observation?: string | null;
}

export interface PrintJob {
  orderId: number;
  table?: string | null;
  customerName?: string | null;
  location: string; // ProductionLocation.code
  items: PrintItem[];
}
