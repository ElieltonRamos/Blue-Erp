import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ProductionLocationsService } from '../../services/location.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-user.html',
})
export class CreateUser implements OnInit {
  private notification = inject(NotificationService);
  private userService = inject(UserService);
  private locationsService = inject(ProductionLocationsService);
  private cdr = inject(ChangeDetectorRef);

  productionLocations: { code: string; name: string }[] = [];

  formCreateUser = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    workplace: new FormControl('', [Validators.required]),
  });

  ngOnInit() {
    this.loadProductionLocations();
  }

  loadProductionLocations() {
    this.locationsService.getAll().subscribe({
      next: (locations) => {
        this.productionLocations = locations.map((loc) => ({
          code: loc.code,
          name: loc.name,
        }));
        this.cdr.detectChanges(); 
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar locais: ${e.error?.message || e.message}`);
      },
    });
  }

  onSubmit() {
    if (this.formCreateUser.invalid) {
      this.formCreateUser.markAllAsTouched();
      return;
    }

    const { password, role, username, workplace } = this.formCreateUser.value;
    const newUser = {
      username: username || '',
      password: password || '',
      role: role || '',
      workplace: workplace || '',
    };

    this.userService.createUser(newUser).subscribe({
      next: (response) => {
        this.notification.success(`Usuário ${response.username} registrado com sucesso!`);
        this.formCreateUser.reset();
      },
      error: (e) => {
        this.notification.error(`Erro ao registrar usuário: ${e.error?.message || e.message}`);
        this.formCreateUser.markAllAsTouched();
      },
    });
  }
}
