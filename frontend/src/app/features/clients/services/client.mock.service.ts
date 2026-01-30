import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import { map, take, delay } from 'rxjs/operators';
import Client from '../types/clients';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

const CLIENTS_KEY = 'mock_clients';
const DEFAULT_PAGE_SIZE = 10;

@Injectable({
  providedIn: 'root',
})
export class ClientMockService {
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  private clients$ = this.clientsSubject.asObservable();

  constructor() {
    this.loadClientsFromStorage();
  }

  private async loadClientsFromStorage(): Promise<void> {
    const stored = localStorage.getItem(CLIENTS_KEY);
    const clients: Client[] = stored ? JSON.parse(stored) : this.generateMockClients(20);
    this.clientsSubject.next(clients);
    this.saveClientsToStorage(clients);
  }

  private saveClientsToStorage(clients: Client[]): void {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }

  private generateMockClients(count: number): Client[] {
    const clients: Client[] = [];
    const names = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Lucas Pereira', 
                   'Fernanda Lima', 'Ricardo Souza', 'Juliana Almeida', 'Marcos Rocha', 'Carla Mendes'];
    const phones = ['11987654321', '11987654322', '11987654323', '11987654324', '11987654325'];
    const cpfs = ['123.456.789-00', '234.567.890-11', '345.678.901-22', '456.789.012-33', '567.890.123-44'];

    for (let i = 1; i <= count; i++) {
      clients.push({
        id: i,
        name: names[i % names.length],
        phone: phones[i % phones.length],
        address: `Rua Exemplo ${i}, 123 - Bairro Teste, São Paulo - SP`,
        cpf: cpfs[i % cpfs.length]
      });
    }
    return clients;
  }

  findClientById(id: number): Observable<Client | null> {
    return this.clients$.pipe(
      map(clients => clients.find(c => c.id === id) || null),
      delay(300)
    );
  }

  findClientByName(name: string): Observable<Client[]> {
    return this.clients$.pipe(
      map(clients => clients.filter(c => 
        c.name.toLowerCase().includes(name.toLowerCase())
      )),
      delay(500)
    );
  }

  getClients(page: number, pageLimit: number = DEFAULT_PAGE_SIZE): Observable<PaginatedResponse<Client>> {
    return this.clients$.pipe(
      map(clients => {
        const startIndex = (page - 1) * pageLimit;
        const endIndex = startIndex + pageLimit;
        const paginatedClients = clients.slice(startIndex, endIndex);
        
        return {
          data: paginatedClients,
          total: clients.length,
          page,
          limit: pageLimit,  // ✅ CORRIGIDO: 'pageLimit' → 'limit'
          pageLimit,
          totalPages: Math.ceil(clients.length / pageLimit)
        } as PaginatedResponse<Client>;
      }),
      delay(400)
    );
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return new Observable<Client>(observer => {
      firstValueFrom(this.clients$).then((clients: Client[]) => {
        const newId = Math.max(...clients.map(c => c.id || 0), 0) + 1;
        const newClient: Client = { 
          id: newId, 
          name: client.name!, 
          phone: client.phone!, 
          address: client.address!, 
          cpf: client.cpf! 
        };
        const updatedClients = [...clients, newClient];
        
        this.clientsSubject.next(updatedClients);
        this.saveClientsToStorage(updatedClients);
        
        observer.next(newClient);
        observer.complete();
      }).catch(err => observer.error(err));
    }).pipe(delay(600));
  }

  deleteClient(id: number): Observable<void> {
    return new Observable<void>(observer => {
      firstValueFrom(this.clients$).then((clients: Client[]) => {
        const updatedClients = clients.filter(c => c.id !== id);
        this.clientsSubject.next(updatedClients);
        this.saveClientsToStorage(updatedClients);
        
        observer.next();
        observer.complete();
      }).catch(err => observer.error(err));
    }).pipe(delay(500));
  }

  updateClient(id: number, client: Partial<Client>): Observable<Client> {
    return new Observable<Client>(observer => {
      firstValueFrom(this.clients$).then((clients: Client[]) => {
        const updatedClients = clients.map(c => 
          c.id === id ? { ...c, ...client, id } : c
        );
        
        this.clientsSubject.next(updatedClients);
        this.saveClientsToStorage(updatedClients);
        
        const updatedClient = updatedClients.find(c => c.id === id)!;
        observer.next(updatedClient);
        observer.complete();
      }).catch(err => observer.error(err));
    }).pipe(delay(500));
  }

  // Método utilitário para resetar dados
  clearAllClients(): void {
    localStorage.removeItem(CLIENTS_KEY);
    this.clientsSubject.next([]);
  }
}
