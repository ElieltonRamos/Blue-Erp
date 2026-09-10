import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import { Asset, CreateAssetDTO, FilterAssetParams, UpdateAssetDTO } from '../types/asset.type';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private apiUrl = `${environment.apiUrl}/assets`;
  private client = inject(HttpClient);

  getAll(
    page: number = 1,
    limit: number = 50,
    filters?: FilterAssetParams,
    sortKey: string = 'clientId',
    sortOrder: string = 'asc',
  ): Observable<PaginatedResponse<Asset>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.clientId) params = params.set('clientId', filters.clientId.toString());
    if (filters?.type) params = params.set('type', filters.type);

    return this.client.get<PaginatedResponse<Asset>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Asset> {
    return this.client.get<Asset>(`${this.apiUrl}/${id}`);
  }

  create(asset: CreateAssetDTO): Observable<Asset> {
    return this.client.post<Asset>(this.apiUrl, asset);
  }

  update(id: number, asset: UpdateAssetDTO): Observable<Asset> {
    return this.client.patch<Asset>(`${this.apiUrl}/${id}`, asset);
  }
}
