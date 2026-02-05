import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

export interface Product {
  id: number;
  name: string;
  code: string;
  productionLocation?: string;
  price: number;
  costPrice: number;
  ncm: string;
  cest?: string;
  origin: number;
  csosn?: string;
  cst?: string;
  icmsRate?: number;
  cstPis?: string;
  pisRate?: number;
  cstCofins?: string;
  cofinsRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  unit: string;
  quantity: number;
  minStock?: number;
  active: boolean;
  productType: 'MANUFACTURED' | 'RESALE';
  categoryId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompositionItem {
  materialId: number;
  quantity: number;
}

export interface PreparationStep {
  order: number;
  description: string;
}

export interface CreateProductDTO {
  name: string;
  code: string;
  productionLocation?: string;
  price: number;
  costPrice: number;
  ncm: string;
  cest?: string;
  origin: number;
  csosn?: string;
  cst?: string;
  icmsRate?: number;
  cstPis?: string;
  pisRate?: number;
  cstCofins?: string;
  cofinsRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  unit: string;
  quantity?: number;
  minStock?: number;
  active?: boolean;
  productType: 'MANUFACTURED' | 'RESALE';
  categoryId?: number;
  composition?: CompositionItem[];
  preparationSteps?: PreparationStep[];
}

export interface UpdateProductDTO {
  name?: string;
  code?: string;
  productionLocation?: string;
  price?: number;
  costPrice?: number;
  ncm?: string;
  cest?: string;
  origin?: number;
  csosn?: string;
  cst?: string;
  icmsRate?: number;
  cstPis?: string;
  pisRate?: number;
  cstCofins?: string;
  cofinsRate?: number;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  unit?: string;
  quantity?: number;
  minStock?: number;
  active?: boolean;
  productType?: 'MANUFACTURED' | 'RESALE';
  categoryId?: number;
}

export interface UpdateCompositionDTO {
  composition: CompositionItem[];
}

export interface UpdatePreparationDTO {
  steps: PreparationStep[];
}

export interface ProduceProductDTO {
  quantity: number;
}

export interface ProductSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalStockValue: number;
  productsLowStock: number;
  totalItems: number;
}

export interface StockAlert {
  id: number;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  price: number;
  estimatedValue: number;
}

export interface FilterProductParams {
  search?: string;
  productType?: 'MANUFACTURED' | 'RESALE';
  unit?: string;
  active?: boolean;
  lowStock?: boolean;
  categoryId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private client = inject(HttpClient);

  getAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterProductParams,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.productType) params = params.set('productType', filters.productType);
    if (filters?.unit) params = params.set('unit', filters.unit);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());
    if (filters?.lowStock !== undefined)
      params = params.set('lowStock', filters.lowStock.toString());
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId.toString());

    return this.client.get<PaginatedResponse<Product>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Product> {
    return this.client.get<Product>(`${this.apiUrl}/${id}`);
  }

  getByCode(code: string): Observable<Product> {
    return this.client.get<Product>(`${this.apiUrl}/code/${code}`);
  }

  getSummary(): Observable<ProductSummary> {
    return this.client.get<ProductSummary>(`${this.apiUrl}/summary`);
  }

  getStockAlerts(): Observable<StockAlert[]> {
    return this.client.get<StockAlert[]>(`${this.apiUrl}/stock-alerts`);
  }

  getSuggestCode(): Observable<{ code: string }> {
    return this.client.get<{ code: string }>(`${this.apiUrl}/suggest-code`);
  }

  getComposition(id: number): Observable<any> {
    return this.client.get(`${this.apiUrl}/${id}/composition`);
  }

  getPreparation(id: number): Observable<any> {
    return this.client.get(`${this.apiUrl}/${id}/preparation`);
  }

  create(product: CreateProductDTO): Observable<Product> {
    return this.client.post<Product>(this.apiUrl, product);
  }

  update(id: number, product: UpdateProductDTO): Observable<Product> {
    return this.client.patch<Product>(`${this.apiUrl}/${id}`, product);
  }

  updateComposition(id: number, composition: UpdateCompositionDTO): Observable<any> {
    return this.client.patch(`${this.apiUrl}/${id}/composition`, composition);
  }

  updatePreparation(id: number, preparation: UpdatePreparationDTO): Observable<any> {
    return this.client.patch(`${this.apiUrl}/${id}/preparation`, preparation);
  }

  produce(id: number, produceDto: ProduceProductDTO): Observable<any> {
    return this.client.post(`${this.apiUrl}/${id}/produce`, produceDto);
  }

  delete(id: number): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/${id}`);
  }
}
