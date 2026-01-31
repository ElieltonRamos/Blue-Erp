import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';
import User from '../../login/types/auth';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  createUser(user: User) {
    return this.client.post<User>(`${this.apiUrl}/users`, user);
  }

  getUsers() {
    return this.client.get<User[]>(`${this.apiUrl}/users`);
  }

  editUser(id: number, user: User) {
    const { id: _, createdAt, updatedAt, deletedAt, ...userData } = user;
    return this.client.patch<User>(`${this.apiUrl}/users/${id}`, userData);
  }

  deleteUser(id: number) {
    return this.client.delete<User>(`${this.apiUrl}/users/${id}`);
  }
}
