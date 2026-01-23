import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardMenu } from "../components/card-menu/card-menu";

@Component({
  selector: 'app-dashboard',
  imports: [CardMenu],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private router = inject(Router);
  userType: string = '';

  ngOnInit() {
    const rawToken = localStorage.getItem('token');
    if (rawToken) {
      try {
        const parsed = JSON.parse(rawToken);
        this.userType = parsed?.token?.userType || '';
      } catch (e) {
        alert(`Erro ao fazer parse do token: ${e}`);
        this.userType = '';
      }
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  isActive(): boolean {
    return this.userType === 'Administrador';
  }
}
