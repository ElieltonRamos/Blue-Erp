import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Product, { GetSugestionCode } from '../types/product';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);
  
  getProductByCode(code: string): Observable<Product> {
    return this.client.get<Product>(`${this.apiUrl}/product/code/${code}`);
  }

  getProductByName(name: string): Observable<Product[]> {
    return this.client.get<Product[]>(`${this.apiUrl}/product/name/${name}`);
  }

  getSugestionCode(): Observable<GetSugestionCode> {
    return this.client.get<GetSugestionCode>(`${this.apiUrl}/product/sugestion/code`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.client.post<Product>(`${this.apiUrl}/product/register`, product);
  }

  getAllProducts(
    page: number,
    pageLimit: number,
    sortKey: string = 'id',
    sortOrder: string = 'asc',
  ): Observable<PaginatedResponse<Product>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageLimit', pageLimit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    return this.client.get<PaginatedResponse<Product>>(`${this.apiUrl}/product`, { params });
  }

  deleteProduct(id: number): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/product/delete/${id}`);
  }

  updateProduct(product: Product): Observable<Product> {
    return this.client.patch<Product>(`${this.apiUrl}/product/update/${product.id}`, product);
  }
}
