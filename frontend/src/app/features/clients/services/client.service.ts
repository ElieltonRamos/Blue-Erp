import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import Client from '../types/clients';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  findClientById(id: number) {
    return this.client.get<Client>(`${this.apiUrl}/clients/${id}`);
  }

  findClientByName(name: string) {
    const params = new HttpParams().set('name', name);
    return this.client.get<Client[]>(`${this.apiUrl}/clients/search`, { params });
  }

  getClients(page: number, pageLimit: number, name?: string, status?: string) {
    let params = new HttpParams().set('page', page.toString()).set('limit', pageLimit.toString()); // CORRIGIDO: 'limit' em vez de 'pageLimit'

    if (name && name.trim() !== '') {
      params = params.set('name', name.trim());
    }

    if (status && status !== 'all') {
      params = params.set('filterStatus', status); // CORRIGIDO: envia 'active' ou 'inactive' diretamente
    }

    return this.client.get<PaginatedResponse<Client>>(`${this.apiUrl}/clients`, { params });
  }

  createClient(client: Client) {
    const { id: _, createdAt, updatedAt, ...clientData } = client;
    return this.client.post<Client>(`${this.apiUrl}/clients/`, clientData);
  }

  deleteClient(id: number) {
    return this.client.delete(`${this.apiUrl}/clients/${id}`);
  }

  updateClient(id: number, client: Client) {
    const { id: _, createdAt, updatedAt, ...clientData } = client;
    return this.client.patch<Client>(`${this.apiUrl}/clients/${id}`, clientData);
  }
}
