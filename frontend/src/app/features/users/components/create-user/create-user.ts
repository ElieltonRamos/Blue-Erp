import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-create-user',
  imports: [ReactiveFormsModule],
  templateUrl: './create-user.html',
})
export class CreateUser {
  private notification = inject(NotificationService);
  formCreateUser = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    workplace: new FormControl('', [Validators.required]),
  });
  private userService = inject(UserService);

  onSubmit() {
    const { password, role, username, workplace } = this.formCreateUser.value;
    const newUser = {
      username: username || '',
      password: password || '',
      role: role || '',
      workplace: workplace || ''
    };

    if (this.formCreateUser.valid) {
      this.userService.createUser(newUser).subscribe({
        next: (response) => {
          this.notification.success(`Usuario ${response.username} registrado com sucesso!`);
          this.formCreateUser.reset();
        },
        error: (e) => {
          this.notification.error(
            `Erro ao registrar usuario: ${e.error?.message || e.message}`,
          );
          this.formCreateUser.markAllAsTouched();
        },
      });
    } else {
      this.formCreateUser.markAllAsTouched();
    }
  }
}
