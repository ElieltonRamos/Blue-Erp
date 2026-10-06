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

  findClientByCnpj(cnpj: string) {
    const params = new HttpParams().set('cnpj', cnpj);
    return this.client.get<Client | null>(`${this.apiUrl}/clients/search/cnpj`, { params });
  }

  getClients(page: number, pageLimit: number, name?: string, status?: string) {
    let params = new HttpParams().set('page', page.toString()).set('limit', pageLimit.toString());

    if (name && name.trim() !== '') {
      params = params.set('name', name.trim());
    }

    if (status && status !== 'all') {
      params = params.set('filterStatus', status);
    }

    return this.client.get<PaginatedResponse<Client>>(`${this.apiUrl}/clients`, { params });
  }

  createClient(client: Client) {
    return this.client.post<Client>(`${this.apiUrl}/clients/`, this.buildPayload(client));
  }

  deleteClient(id: number) {
    return this.client.delete(`${this.apiUrl}/clients/${id}`);
  }

  updateClient(id: number, client: Client) {
    return this.client.patch<Client>(
      `${this.apiUrl}/clients/${id}`,
      this.buildUpdatePayload(client),
    );
  }

  private readonly clearableFields = [
    'address',
    'cpf',
    'cnpj',
    'stateRegistration',
    'ieIndicator',
    'street',
    'number',
    'complement',
    'neighborhood',
    'city',
    'cityCode',
    'state',
    'zipCode',
  ];

  // Na edição, campo vazio vira null (limpa no banco). Campos obrigatórios vazios são omitidos.
  private buildUpdatePayload(client: Client): Record<string, unknown> {
    const { id: _, createdAt, updatedAt, ...data } = client;
    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;

      if (value === '' || value === null) {
        if (this.clearableFields.includes(key)) {
          payload[key] = null;
        }
        continue;
      }

      payload[key] = value;
    }

    return payload;
  }

  // Remove id/createdAt/updatedAt e campos vazios ('' / null / undefined).
  // O backend valida cada campo opcional (CNPJ, UF, CEP, código IBGE...), então
  // string vazia de formulário geraria 400.
  private buildPayload(client: Client): Partial<Client> {
    const { id: _, createdAt, updatedAt, ...data } = client;
    return Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) => value !== '' && value !== null && value !== undefined,
      ),
    ) as Partial<Client>;
  }
}
