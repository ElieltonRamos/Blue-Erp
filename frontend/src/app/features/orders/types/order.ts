interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type OrderType = "dine_in" | "delivery";

type OrderStatus = "open" | "closed" | "canceled";

interface Order {
  id: string;
  type: OrderType;          // dine_in = mesa, delivery = entrega
  items: OrderItem[];       // lista de itens do pedido
  status: OrderStatus;      // estado atual
  total: number;            // total geral do pedido
  customerName?: string;    // nome do cliente (opcional)
}
