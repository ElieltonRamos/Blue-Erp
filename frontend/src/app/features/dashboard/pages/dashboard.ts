import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardMenu } from '../components/card-menu/card-menu';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/toastr/notification.service';

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
  role: string = '';
  isAdmin: boolean = false;

  ngOnInit() {
    const payload = this.auth.getTokenPayload();

    if (!payload) {
      this.notification.warning('Sessão inválida');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return;
    }

    this.userName = payload.username;
    this.role = payload.role || 'garcom';
    this.isAdmin = this.role === 'admin';

  }

  logout() {
    localStorage.removeItem('token');
    this.notification.info('Logout realizado');
    this.router.navigate(['/']);
  }

  isActive(): boolean {
    return this.isAdmin;
  }
}
