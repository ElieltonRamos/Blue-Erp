// mock-order.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject, delay } from 'rxjs';
import {
  Order,
  OrderStatus,
  CreateOrderDto,
  Product,
  OrderFilters,
  FinishOrderDto,
  Sale,
  OrderItem,
  OrderType,
  PaymentMethod,
  OrderLocation,
} from '../types/order';

@Injectable({
  providedIn: 'root'
})
export class MockOrderService {
  private ordersKey = 'mock_orders';
  private productsKey = 'mock_products';
  private salesKey = 'mock_sales';
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private orders$ = this.ordersSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Inicializa produtos se não existirem
    if (!localStorage.getItem(this.productsKey)) {
      const mockProducts: Product[] = [
        {
          id: '1',
          code: '7891234567890',
          name: 'Coca-Cola 2L',
          price: 8.50,
          description: 'Refrigerante Coca-Cola 2L',
          stock: 50,
          ncm: '2202.10.00',
          cfop: '5102',
          csosn: '103',
          origem: 0
        },
        {
          id: '2',
          code: '7896543210987',
          name: 'Hambúrguer Clássico',
          price: 25.00,
          description: 'Hambúrguer com carne 180g, queijo, alface, tomate',
          stock: 30,
          ncm: '2106.90.90',
          cfop: '5102',
          csosn: '103',
          origem: 0
        },
        {
          id: '3',
          code: '1122334455667',
          name: 'Batata Frita Grande',
          price: 15.00,
          description: 'Batata frita grande com tempero especial',
          stock: 100,
          ncm: '2004.10.00',
          cfop: '5102',
          csosn: '103',
          origem: 0
        }
      ];
      localStorage.setItem(this.productsKey, JSON.stringify(mockProducts));
    }

    // Inicializa pedidos se não existirem
    if (!localStorage.getItem(this.ordersKey)) {
      const mockOrders: Order[] = [
        {
          id: 'order-1',
          type: 'dine_in',
          locationId: 'local-01',
          customerName: 'João Silva',
          items: [
            { id: 'item1', code: '7891234567890', name: 'Coca-Cola 2L', quantity: 2, unitPrice: 8.50, total: 17.00 }
          ],
          status: 'open',
          total: 17.00,
          table: 'Mesa 5',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'order-2',
          type: 'delivery',
          locationId: 'delivery',
          customerName: 'Maria Santos',
          items: [
            { id: 'item2', code: '7896543210987', name: 'Hambúrguer Clássico', quantity: 1, unitPrice: 25.00, total: 25.00 },
            { id: 'item3', code: '1122334455667', name: 'Batata Frita Grande', quantity: 1, unitPrice: 15.00, total: 15.00 }
          ],
          status: 'open',
          total: 40.00,
          address: 'Rua das Flores, 123 - Centro',
          createdAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 'order-3',
          type: 'dine_in',
          locationId: 'local-02',
          customerName: 'Carlos Oliveira',
          items: [
            { id: 'item4', code: '7896543210987', name: 'Hambúrguer Clássico', quantity: 2, unitPrice: 25.00, total: 50.00 }
          ],
          status: 'open',
          total: 50.00,
          table: 'Mesa 3',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'order-4',
          type: 'dine_in',
          locationId: 'local-03',
          customerName: 'Ana Paula',
          items: [
            { id: 'item5', code: '1122334455667', name: 'Batata Frita Grande', quantity: 3, unitPrice: 15.00, total: 45.00 }
          ],
          status: 'closed',
          total: 45.00,
          table: 'Mesa 7',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          finishedAt: new Date(Date.now() - 9000000).toISOString()
        }
      ];
      localStorage.setItem(this.ordersKey, JSON.stringify(mockOrders));
      this.ordersSubject.next(mockOrders);
    }
  }

  // ==================== ORDERS ====================

  getOrders(filters?: OrderFilters): Observable<Order[]> {
    const orders = this.getOrdersFromStorage();
    
    let filteredOrders = orders;
    
    if (filters) {
      if (filters.searchName) {
        filteredOrders = filteredOrders.filter(order =>
          order.customerName?.toLowerCase().includes(filters.searchName!.toLowerCase())
        );
      }
      if (filters.searchId) {
        filteredOrders = filteredOrders.filter(order =>
          order.id.includes(filters.searchId!)
        );
      }
      if (filters.status && filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }
      if (filters.location && filters.location !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.locationId === filters.location);
      }
    }

    // Paginação
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    // Simula delay de rede
    return of(paginatedOrders).pipe(delay(300));
  }

  getOrderById(orderId: string): Observable<Order> {
    const order = this.getOrdersFromStorage().find(o => o.id === orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }
    return of(order).pipe(delay(200));
  }

  createOrder(order: CreateOrderDto): Observable<Order> {
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    const orders = this.getOrdersFromStorage();
    orders.unshift(newOrder);
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
    this.ordersSubject.next(orders);

    return of(newOrder).pipe(delay(500));
  }

  updateOrder(orderId: string, order: Partial<Order>): Observable<Order> {
    const orders = this.getOrdersFromStorage();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error('Pedido não encontrado');
    }

    orders[orderIndex] = { ...orders[orderIndex], ...order, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
    this.ordersSubject.next(orders);

    return of(orders[orderIndex]).pipe(delay(300));
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.updateOrder(orderId, { status });
  }

  deleteOrder(orderId: string): Observable<void> {
    const orders = this.getOrdersFromStorage().filter(o => o.id !== orderId);
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
    this.ordersSubject.next(orders);
    return of(void 0).pipe(delay(200));
  }

  finishOrder(orderId: string): Observable<Order> {
    return this.updateOrderStatus(orderId, 'closed');
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.updateOrderStatus(orderId, 'canceled');
  }

  // ==================== PRODUCTS ====================

  searchProducts(query: { code?: string; name?: string }): Observable<Product[]> {
    const products = this.getProductsFromStorage();
    let filteredProducts = products;

    if (query.code) {
      filteredProducts = filteredProducts.filter(p => 
        p.code.includes(query.code!)
      );
    }
    if (query.name) {
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }

    return of(filteredProducts).pipe(delay(250));
  }

  getProductByCode(code: string): Observable<Product> {
    const product = this.getProductsFromStorage().find(p => p.code === code);
    if (!product) {
      throw new Error('Produto não encontrado');
    }
    return of(product).pipe(delay(150));
  }

  getProducts(): Observable<Product[]> {
    return of(this.getProductsFromStorage()).pipe(delay(200));
  }

  // ==================== SALES ====================

  finalizeSale(saleData: FinishOrderDto): Observable<Sale> {
    const newSale: Sale = {
      id: Date.now(),
      clientName: saleData.clientName,
      userOperator: saleData.userOperator,
      paymentMethod: saleData.paymentMethod,
      date: new Date(),
      totalProductsWithoutDiscount: saleData.subtotal,
      total: saleData.total,
      isPaid: true,
      discount: saleData.discount,
      profitSale: saleData.total * 0.3, // Mock profit
      cfop: saleData.cfop,
      nfceStatus: 'pendente',
      amountReceived: saleData.amountReceived || saleData.total,
      change: saleData.change || 0,
      products: saleData.items.map((item, index) => ({
        productId: parseInt(item.code),
        nItem: index + 1,
        cProd: item.code,
        xProd: item.name,
        ncm: '2202.10.00', // Mock
        cfop: saleData.cfop,
        csosn: saleData.csosn,
        origem: 0,
        uCom: 'UN',
        qCom: item.quantity,
        vUnCom: item.unitPrice,
        indTot: 1,
        pisCst: '07',
        cofinsCst: '07'
      }))
    };

    // Remove order após finalizar venda
    this.deleteOrder(saleData.orderId);

    const sales = this.getSalesFromStorage();
    sales.unshift(newSale);
    localStorage.setItem(this.salesKey, JSON.stringify(sales));

    return of(newSale).pipe(delay(800));
  }

  getSaleById(saleId: string): Observable<Sale> {
    const sale = this.getSalesFromStorage().find(s => s.id?.toString() === saleId);
    if (!sale) {
      throw new Error('Venda não encontrada');
    }
    return of(sale).pipe(delay(200));
  }

  // ==================== HELPERS ====================

  private getOrdersFromStorage(): Order[] {
    const orders = localStorage.getItem(this.ordersKey);
    return orders ? JSON.parse(orders) : [];
  }

  private getProductsFromStorage(): Product[] {
    const products = localStorage.getItem(this.productsKey);
    return products ? JSON.parse(products) : [];
  }

  private getSalesFromStorage(): Sale[] {
    const sales = localStorage.getItem(this.salesKey);
    return sales ? JSON.parse(sales) : [];
  }
}