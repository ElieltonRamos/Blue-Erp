import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardMenu } from '../components/card-menu/card-menu';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/toastr/notification.service';

type Role = 'admin' | 'caixa' | 'garcom' | 'cozinheiro';

const PERMISSIONS: Record<string, Role[]> = {
  '/clientes': ['admin', 'caixa'],
  '/comandas': ['admin', 'caixa', 'garcom'],
  '/cozinha': ['admin', 'cozinheiro'],
  '/mesas': ['admin', 'caixa', 'garcom'],
  '/produtos': ['admin'],
  '/usuarios': ['admin'],
  '/historico-vendas': ['admin', 'caixa'],
  '/relatorios': ['admin', 'caixa'],
  '/financeiro': ['admin', 'caixa'],
  '/empresa': ['admin'],
};

@Component({
  selector: 'app-dashboard',
  imports: [CardMenu],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);

  userName: string = '';
  role: Role = 'garcom';

  ngOnInit() {
    const payload = this.auth.getTokenPayload();

    if (!payload) {
      this.notification.warning('Sessão inválida');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return;
    }

    this.userName = payload.username;
    this.role = (payload.role as Role) || 'garcom';
  }

  canAccess(path: string): boolean {
    return PERMISSIONS[path]?.includes(this.role) ?? false;
  }

  logout() {
    localStorage.removeItem('token');
    this.notification.info('Logout realizado');
    this.router.navigate(['/']);
  }
}
