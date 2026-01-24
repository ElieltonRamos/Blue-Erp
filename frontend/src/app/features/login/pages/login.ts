import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { alertLoading, closeLoading } from '../../../shared/alerts/custom-alerts';
import { Router } from '@angular/router';
import { ServiceLogin } from '../services/login.service';
import { NotificationService } from '../../../shared/toastr/notification.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private route = inject(Router);
  private loginService = inject(ServiceLogin);
  private notification = inject(NotificationService);

  form = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  ngOnInit() {
    localStorage.removeItem('token');
  }

  onSubmit() {
    const { username, password } = this.form.value;

    if (typeof username !== 'string' || typeof password !== 'string' || this.form.invalid) {
      return;
    }

    alertLoading();

    this.loginService.login(username, password).subscribe({
      next: (response) => {
        if ('token' in response) {
          localStorage.setItem('token', response.token);
          closeLoading();
          this.notification.success(`Bem Vindo! 👋`);
          this.route.navigate(['/dashboard']);
        } else {
          closeLoading();
          this.notification.error(response.message);
        }
      },
      error: (err) => {
        closeLoading();
        localStorage.removeItem('token');
        this.notification.error('Erro de conexão');
      },
    });

    this.form.reset();
  }
}
