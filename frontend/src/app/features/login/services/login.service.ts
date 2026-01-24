import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../core/services/environment';
import { Token } from '../types/auth';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServiceLogin {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  login(
    username: string,
    password: string,
  ): Observable<Token | { status: number; message: string }> {
    if (username === 'Elielton' && password === '1234') {
      const mockToken: Token = {
        token:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6IkVsaWVsdG9uIiwicm9sZSI6ImFkbWluIn0.fFGDolVbwKxe1bOG9h0DxiP3nwdDNmy7hm_dTZ_So8s',
      };
      return of(mockToken);
    }
    return throwError(() => ({ status: 401, message: 'Usuário ou senha incorreta' }));
  }

  // login(username: string, password: string) {
  //   return this.client.post<Token>(`${this.apiUrl}/users/login`, {
  //     username,
  //     password,
  //   });
  // }
}
