import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinancialService } from '../../services/financial.service';
import Expense from '../../types/Expense';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-create-expenses',
  imports: [ReactiveFormsModule],
  templateUrl: './create-expenses.html',
})
export class CreateExpenses {
  formCreateExpense = new FormGroup({
    supplier: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    value: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    status: new FormControl('Pendente', [Validators.required]),
    datePayment: new FormControl('', [Validators.required]),
  });
  private financialService = inject(FinancialService);
  private notification = inject(NotificationService)

  onSubmit() {
    const { supplier, description, value, datePayment } = this.formCreateExpense.value;
    const newExpense: Expense = {
      supplier: supplier || '',
      description: description || '',
      value: value ? parseFloat(value.toString()) : 0,
      status: 'Pendente',
      datePayment: datePayment || new Date().toISOString(),
    };

    if (this.formCreateExpense.valid) {
      this.financialService.createExpense(newExpense).subscribe({
        next: (_response) => {
          this.notification.success(`Despesa registrada com sucesso!`);
          this.formCreateExpense.reset();
        },
        error: (e) => {
          this.notification.error(`Error ao registrar despesa: ${e.error.message}`);
          this.formCreateExpense.markAllAsTouched();
        },
      });
    } else {
      this.formCreateExpense.markAllAsTouched();
    }
  }
}
