import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../core/services/environment';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import Category from '../types/category';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getCategories(page: number, limit: number, search?: string, status?: string) {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    if (status && status !== 'all') {
      params = params.set('active', status === 'active' ? 'true' : 'false');
    }

    return this.http.get<PaginatedResponse<Category>>(`${this.apiUrl}/categories`, { params });
  }

  createCategory(category: Category) {
    const { id: _, createdAt, updatedAt, ...data } = category;
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, category: Category) {
    const { id: _, createdAt, updatedAt, ...data } = category;
    return this.http.patch<Category>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number) {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }
}
