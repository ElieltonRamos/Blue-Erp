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
    return this.client.post<User>(`${this.apiUrl}/user/create`, user);
  }

  getUsers() {
    return this.client.get<User[]>(`${this.apiUrl}/user`);
  }

  editUser(id: number, user: User) {
    return this.client.put<User>(`${this.apiUrl}/user/edit/${id}`, user);
  }

  deleteUser(id: number) {
    return this.client.delete<User>(`${this.apiUrl}/user/delete/${id}`);
  }
}
