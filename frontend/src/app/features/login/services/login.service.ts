import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../shared/environment';
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root',
})
export class ServiceLogin {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  login(username: string, password: string) {
    return this.client.post<Token>(`${this.apiUrl}/user/login`, {
      username,
      password,
    });
  }
}
