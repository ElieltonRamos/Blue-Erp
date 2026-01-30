import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import { Table, TableProduct, ProductTable, CloseTabResponse, TableStatus } from '../types/table';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';

const TABLES_KEY = 'mock_tables';
const PRODUCTS_KEY = 'mock_products';

@Injectable({
  providedIn: 'root',
})
export class TableMockService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);
  private tablesSubject = new BehaviorSubject<Table[]>([]);
  private productsSubject = new BehaviorSubject<ProductTable[]>([]);

  constructor() {
    this.loadTablesFromStorage();
    this.loadProductsFromStorage();
  }

  // --- Helper: load/save from localStorage ---

  private loadTablesFromStorage(): void {
    const stored = localStorage.getItem(TABLES_KEY);
    const tables: Table[] = stored ? JSON.parse(stored) : this.generateMockTables(10);
    this.tablesSubject.next(tables);
    this.saveTablesToStorage(tables);
  }

  private saveTablesToStorage(tables: Table[]): void {
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
  }

  private loadProductsFromStorage(): void {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    const products: ProductTable[] = stored ? JSON.parse(stored) : this.generateMockProducts(15);
    this.productsSubject.next(products);
  }

  private saveProductsToStorage(products: ProductTable[]): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  // --- Mock data generators ---

  private generateMockTables(count: number): Table[] {
    const tables: Table[] = [];

    for (let i = 1; i <= count; i++) {
      const status: TableStatus = i <= 3 ? 'occupied' : i <= 6 ? 'reserved' : 'available';

      tables.push({
        id: i,
        number: i,
        capacity: 4,
        status,
        customer:
          status === 'occupied'
            ? `Cliente ${i}`
            : status === 'reserved'
              ? `Cliente ${i} (reserva)`
              : undefined,
        time: status === 'reserved' ? '20:00' : undefined,
        products: [],
      });
    }

    return tables;
  }

  private generateMockProducts(count: number): ProductTable[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `Produto ${index + 1}`,
      price: (20 + index * 5).toFixed(2) as unknown as number,
      category: index % 2 === 0 ? 'Bebidas' : 'Comida',
    }));
  }

  // --- Service methods (mesma assinatura do TableService) ---

  getTables(): Observable<Table[]> {
    return this.tablesSubject.asObservable();
  }

  getTableById(id: number): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === id);
        if (!table) {
          throw new Error(`Table ${id} not found`);
        }
        return { ...table };
      }),
      delay(300),
    );
  }

  createTable(table: Table): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const maxId = Math.max(...tables.map((t) => t.id || 0), 0);
        const newId = maxId + 1;
        const newTable: Table = {
          ...table,
          id: newId,
          status: 'available',
          products: [],
        };
        const updatedTables = [...tables, newTable];
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);
        return newTable;
      }),
      delay(400),
    );
  }

  editTable(id: number, updates: Partial<Table>): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const tableIndex = tables.findIndex((t) => t.id === id);
        if (tableIndex === -1) {
          throw new Error(`Table ${id} not found`);
        }

        const updatedTable = {
          ...tables[tableIndex],
          ...updates,
        };

        const updatedTables = [...tables];
        updatedTables[tableIndex] = updatedTable;

        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(400),
    );
  }

  deleteTable(id: number): Observable<void> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const filtered = tables.filter((t) => t.id !== id);
        this.tablesSubject.next(filtered);
        this.saveTablesToStorage(filtered);
      }),
      delay(500),
    );
  }

  occupyTable(id: number, customer: string): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === id);
        if (!table || !(table as any).status) {
          throw new Error(`Table ${id} not found`);
        }
        if (table.status === 'occupied' || table.status === 'reserved') {
          throw new Error(`Table ${id} is not available`);
        }

        const updatedTable = {
          ...table,
          status: 'occupied' as TableStatus,
          customer,
          time: undefined,
        };

        const updatedTables = tables.map((t) => (t.id === id ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(400),
    );
  }

  releaseTable(id: number): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === id);
        if (!table || !(table as any).status) {
          throw new Error(`Table ${id} not found`);
        }

        const updatedTable = {
          ...table,
          status: 'available' as TableStatus,
          customer: undefined,
          time: undefined,
          products: [],
        };

        const updatedTables = tables.map((t) => (t.id === id ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(400),
    );
  }

  reserveTable(id: number, customer: string, time: string): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === id);
        if (!table || !(table as any).status) {
          throw new Error(`Table ${id} not found`);
        }
        if (table.status === 'occupied') {
          throw new Error(`Table ${id} is already occupied`);
        }

        const updatedTable = {
          ...table,
          status: 'reserved' as TableStatus,
          customer,
          time,
        };

        const updatedTables = tables.map((t) => (t.id === id ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(400),
    );
  }

  addProductToTable(tableId: number, product: TableProduct): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
          throw new Error(`Table ${tableId} not found`);
        }

        const finalProduct: TableProduct = {
          ...product,
          id: (table.products?.length || 0) + 1,
        };

        const updatedProducts = (table.products || []).concat(finalProduct);
        const updatedTable = {
          ...table,
          products: updatedProducts,
        };

        const updatedTables = tables.map((t) => (t.id === tableId ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(400),
    );
  }

  removeProductFromTable(tableId: number, productId: number): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
          throw new Error(`Table ${tableId} not found`);
        }

        const updatedProducts = (table.products || []).filter((p) => p.id !== productId);

        const updatedTable = {
          ...table,
          products: updatedProducts,
        };

        const updatedTables = tables.map((t) => (t.id === tableId ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(400),
    );
  }

  updateProductQuantity(tableId: number, productId: number, quantity: number): Observable<Table> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === tableId);
        if (!table) {
          throw new Error(`Table ${tableId} not found`);
        }

        const updatedProducts = (table.products || []).map((p) =>
          p.id === productId
            ? {
                ...p,
                quantity,
                totalPrice: p.unitPrice * quantity,
              }
            : p,
        );

        const updatedTable = {
          ...table,
          products: updatedProducts,
        };

        const updatedTables = tables.map((t) => (t.id === tableId ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return updatedTable;
      }),
      delay(500),
    );
  }

  closeTab(tableId: number): Observable<CloseTabResponse> {
    return this.tablesSubject.pipe(
      map((tables) => {
        const table = tables.find((t) => t.id === tableId);
        if (!table || table.status === 'available') {
          throw new Error(`Table ${tableId} is not occupied`);
        }

        const total = (table.products || []).reduce((sum, p) => sum + p.totalPrice, 0) || 0;

        const saleId = Math.floor(Math.random() * 10000) + 1;

        const updatedTable = {
          ...table,
          status: 'available' as TableStatus,
          customer: undefined,
          time: undefined,
          products: [],
        };

        const updatedTables = tables.map((t) => (t.id === tableId ? updatedTable : t));
        this.tablesSubject.next(updatedTables);
        this.saveTablesToStorage(updatedTables);

        return {
          saleId,
          total,
          message: `Comanda fechada para a mesa ${table.number}`,
        };
      }),
      delay(600),
    );
  }

  getProducts(): Observable<ProductTable[]> {
    return this.productsSubject.asObservable();
  }
}
