import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Table, TableProduct, ProductTable } from '../types/table';

@Injectable({
  providedIn: 'root',
})
export class TableMockService {
  private STORAGE_KEY = 'mock_tables';

  constructor() {
    this.init();
  }

  // ========================
  // INIT
  // ========================

  private init() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const initial: Table[] = [];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initial));
    }
  }

  // ========================
  // HELPERS
  // ========================

  private getData(): Table[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  private saveData(data: Table[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private generateId(): number {
    return Date.now();
  }

  // ========================
  // TABLES
  // ========================

  createTable(table: Table): Observable<Table> {
    const tables = this.getData();

    const newTable: Table = {
      ...table,
      id: this.generateId(),
      status: 'available',
      customer: null,
      time: null,
      products: [],
    };

    tables.push(newTable);
    this.saveData(tables);

    return of(newTable).pipe(delay(300));
  }

  getTables(): Observable<Table[]> {
    return of(this.getData()).pipe(delay(200));
  }

  getTableById(id: number): Observable<Table> {
    const table = this.getData().find((t) => t.id === id);

    if (!table) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    return of(table).pipe(delay(200));
  }

  editTable(id: number, table: Table): Observable<Table> {
    const tables = this.getData();

    const index = tables.findIndex((t) => t.id === id);

    if (index === -1) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    tables[index] = {
      ...tables[index],
      ...table,
    };

    this.saveData(tables);

    return of(tables[index]).pipe(delay(300));
  }

  deleteTable(id: number): Observable<Table> {
    const tables = this.getData();

    const index = tables.findIndex((t) => t.id === id);

    if (index === -1) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    const removed = tables[index];

    tables.splice(index, 1);
    this.saveData(tables);

    return of(removed).pipe(delay(300));
  }

  // ========================
  // STATUS
  // ========================

  occupyTable(id: number, customer: string): Observable<Table> {
    const tables = this.getData();

    const table = tables.find((t) => t.id === id);

    if (!table) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    table.status = 'occupied';
    table.customer = customer;
    table.time = null;

    this.saveData(tables);

    return of(table).pipe(delay(300));
  }

  reserveTable(id: number, customer: string, time: string): Observable<Table> {
    const tables = this.getData();

    const table = tables.find((t) => t.id === id);

    if (!table) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    table.status = 'reserved';
    table.customer = customer;
    table.time = time;

    this.saveData(tables);

    return of(table).pipe(delay(300));
  }

  releaseTable(id: number): Observable<Table> {
    const tables = this.getData();

    const table = tables.find((t) => t.id === id);

    if (!table) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    table.status = 'available';
    table.customer = null;
    table.time = null;
    table.products = [];

    this.saveData(tables);

    return of(table).pipe(delay(300));
  }

  // ========================
  // PRODUCTS
  // ========================

  addProductToTable(tableId: number, product: TableProduct): Observable<Table> {
    const tables = this.getData();

    const table = tables.find((t) => t.id === tableId);

    if (!table) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    const newProduct: TableProduct = {
      ...product,
      id: this.generateId(),
      totalPrice: product.quantity * product.unitPrice,
    };

    table.products = table.products || [];
    table.products.push(newProduct);

    this.saveData(tables);

    return of(table).pipe(delay(300));
  }

  removeProductFromTable(tableId: number, productId: number): Observable<Table> {
    const tables = this.getData();

    const table = tables.find((t) => t.id === tableId);

    if (!table || !table.products) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    table.products = table.products.filter((p) => p.id !== productId);

    this.saveData(tables);

    return of(table).pipe(delay(300));
  }

  updateProductQuantity(tableId: number, productId: number, quantity: number): Observable<Table> {
    const tables = this.getData();

    const table = tables.find((t) => t.id === tableId);

    if (!table || !table.products) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    const product = table.products.find((p) => p.id === productId);

    if (!product) {
      return throwError(() => new Error('Produto não encontrado'));
    }

    product.quantity = quantity;
    product.totalPrice = product.quantity * product.unitPrice;

    this.saveData(tables);

    return of(table).pipe(delay(300));
  }

  // 🆕 IMPLEMENTADO: Fecha comanda E LIBERA mesa
  closeTab(tableId: number): Observable<{ saleId: number }> {
    const tables = this.getData();
    const saleId = this.generateId();

    const tableIndex = tables.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) {
      return throwError(() => new Error('Mesa não encontrada'));
    }

    // 🧹 LIMPA TUDO e LIBERA MESA
    tables[tableIndex] = {
      ...tables[tableIndex],
      status: 'available', // ✅ Liberada
      customer: null, // ✅ Limpo
      time: null, // ✅ Limpo
      products: [], // ✅ Comanda zerada
    };

    this.saveData(tables);
    console.log(`✅ Mesa ${tableId} liberada! Venda #${saleId}`);

    return of({ saleId }).pipe(delay(500));
  }

  // ========================
  // PRODUCTS (FAKE)
  // ========================

  getProducts(): Observable<ProductTable[]> {
    const products: ProductTable[] = [
      { id: 1, name: 'Hambúrguer', price: 25 },
      { id: 2, name: 'Pizza', price: 45 },
      { id: 3, name: 'Refrigerante', price: 8 },
      { id: 4, name: 'Cerveja', price: 12 },
    ];

    return of(products).pipe(delay(200));
  }
}
