import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';
import { ProductTable, Table, TableProduct } from '../types/table';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  createTable(table: Table) {
    return this.client.post<Table>(`${this.apiUrl}/table/create`, table);
  }

  getTables() {
    return this.client.get<Table[]>(`${this.apiUrl}/table`);
  }

  getTableById(id: number) {
    return this.client.get<Table>(`${this.apiUrl}/table/${id}`);
  }

  editTable(id: number, table: Table) {
    return this.client.put<Table>(`${this.apiUrl}/table/edit/${id}`, table);
  }

  deleteTable(id: number) {
    return this.client.delete<Table>(`${this.apiUrl}/table/delete/${id}`);
  }

  occupyTable(id: number, customer: string) {
    return this.client.patch<Table>(`${this.apiUrl}/table/occupy/${id}`, { customer });
  }

  releaseTable(id: number) {
    return this.client.patch<Table>(`${this.apiUrl}/table/release/${id}`, {});
  }

  reserveTable(id: number, customer: string, time: string) {
    return this.client.patch<Table>(`${this.apiUrl}/table/reserve/${id}`, { customer, time });
  }

  addProductToTable(tableId: number, product: TableProduct) {
    return this.client.post<Table>(`${this.apiUrl}/table/${tableId}/products`, product);
  }

  removeProductFromTable(tableId: number, productId: number) {
    return this.client.delete<Table>(`${this.apiUrl}/table/${tableId}/products/${productId}`);
  }

  updateProductQuantity(tableId: number, productId: number, quantity: number) {
    return this.client.patch<Table>(`${this.apiUrl}/table/${tableId}/products/${productId}`, {
      quantity,
    });
  }

  closeTab(tableId: number) {
    return this.client.post<{ saleId: number }>(`${this.apiUrl}/table/${tableId}/close`, {});
  }

  getProducts() {
    return this.client.get<ProductTable[]>(`${this.apiUrl}/product`);
  }
}
