import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';
import Client from '../types/clients';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  findClientById(id: number) {
    return this.client.get<Client>(`${this.apiUrl}/client/${id}`);
  }

  findClientByName(name: string) {
    return this.client.get<Client[]>(`${this.apiUrl}/client/search/${name}`);
  }

  getClients(page: number, pageLimit: number) {
    const params = { page: page.toString(), pageLimit: pageLimit.toString() };
    return this.client.get<PaginatedResponse<Client>>(`${this.apiUrl}/client`, { params });
  }

  createClient(client: Client) {
    return this.client.post<Client>(`${this.apiUrl}/client/register`, client);
  }

  deleteClient(id: number) {
    return this.client.delete(`${this.apiUrl}/client/delete/${id}`);
  }

  updateClient(id: number, client: Client) {
    return this.client.patch<Client>(`${this.apiUrl}/client/update/${id}`, client);
  }
}
