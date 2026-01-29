import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductTable, Table, TableProduct, CloseTabResponse } from '../types/table';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  // GET /tables - Lista todas as mesas
  getTables(): Observable<Table[]> {
    return this.client.get<Table[]>(`${this.apiUrl}/tables`);
  }

  // GET /tables/:id - Busca mesa por ID
  getTableById(id: number): Observable<Table> {
    return this.client.get<Table>(`${this.apiUrl}/tables/${id}`);
  }

  // POST /tables - Cria nova mesa
  createTable(table: Table): Observable<Table> {
    return this.client.post<Table>(`${this.apiUrl}/tables`, table);
  }

  // PUT /tables/:id - Atualiza mesa
  editTable(id: number, table: Table): Observable<Table> {
    return this.client.put<Table>(`${this.apiUrl}/tables/${id}`, table);
  }

  // DELETE /tables/:id - Deleta mesa
  deleteTable(id: number): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/tables/${id}`);
  }

  // PATCH /tables/:id/occupy - Ocupa mesa
  occupyTable(id: number, customer: string): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/tables/${id}/occupy`, { customer });
  }

  // PATCH /tables/:id/release - Libera mesa
  releaseTable(id: number): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/tables/${id}/release`, {});
  }

  // PATCH /tables/:id/reserve - Reserva mesa
  reserveTable(id: number, customer: string, time: string): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/tables/${id}/reserve`, { customer, time });
  }

  // POST /tables/:id/products - Adiciona produto à mesa
  addProductToTable(tableId: number, product: TableProduct): Observable<Table> {
    return this.client.post<Table>(`${this.apiUrl}/tables/${tableId}/products`, product);
  }

  // DELETE /tables/:tableId/products/:productId - Remove produto da mesa
  removeProductFromTable(tableId: number, productId: number): Observable<Table> {
    return this.client.delete<Table>(`${this.apiUrl}/tables/${tableId}/products/${productId}`);
  }

  // PATCH /tables/:tableId/products/:productId - Atualiza quantidade do produto
  updateProductQuantity(tableId: number, productId: number, quantity: number): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/tables/${tableId}/products/${productId}`, {
      quantity,
    });
  }

  // POST /tables/:id/close - Fecha comanda e libera mesa
  closeTab(tableId: number): Observable<CloseTabResponse> {
    return this.client.post<CloseTabResponse>(`${this.apiUrl}/tables/${tableId}/close`, {});
  }

  // GET /products - Lista produtos disponíveis
  getProducts(): Observable<ProductTable[]> {
    return this.client.get<ProductTable[]>(`${this.apiUrl}/products`);
  }
}