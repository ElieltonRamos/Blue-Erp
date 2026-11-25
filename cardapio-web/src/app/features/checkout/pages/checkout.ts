import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../cart/services/cart.service';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { OrderService } from '../../order/services/order.service';
import { StoreInfo } from '../../store-info/types/store';
import { FulfillmentType, OrderRequest } from '../../order/types/oprder';
import { PaymentType } from '../types/checkout';

/** Telefone com DDD: 10 ou 11 dígitos. */
const phoneValidator = (control: AbstractControl): ValidationErrors | null => {
  const digits = String(control.value ?? '').replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? null : { phone: true };
};

/** Campo obrigatório somente quando o recebimento é entrega. */
const requiredWhenDelivery = (control: AbstractControl): ValidationErrors | null => {
  const isDelivery = control.parent?.get('fulfillment')?.value === 'delivery';
  return isDelivery && !String(control.value ?? '').trim() ? { required: true } : null;
};

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'checkout.html',
})
export class CheckoutPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  private readonly orderService = inject(OrderService);
  protected readonly cart = inject(CartService);

  protected readonly store = signal<StoreInfo | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal(false);

  protected readonly inputClass =
    'w-full rounded border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-text-muted focus:border-accent';

  protected readonly form = this.fb.group({
    fulfillment: this.fb.control<FulfillmentType>('delivery'),
    name: ['', Validators.required],
    phone: ['', [Validators.required, phoneValidator]],
    street: ['', requiredWhenDelivery],
    number: ['', requiredWhenDelivery],
    neighborhood: ['', requiredWhenDelivery],
    complement: [''],
    payment: this.fb.control<PaymentType | ''>('', Validators.required),
    changeFor: [''],
  });

  protected readonly fulfillment = toSignal(this.form.controls.fulfillment.valueChanges, {
    initialValue: this.form.controls.fulfillment.value,
  });
  protected readonly paymentType = toSignal(this.form.controls.payment.valueChanges, {
    initialValue: this.form.controls.payment.value,
  });
  private readonly changeForText = toSignal(this.form.controls.changeFor.valueChanges, {
    initialValue: '',
  });

  protected readonly deliveryFee = computed(() =>
    this.fulfillment() === 'delivery' ? (this.store()?.deliveryFee ?? 0) : 0,
  );

  protected readonly total = computed(() => this.cart.total() + this.deliveryFee());

  /** Troco informado, em número (null se vazio ou inválido). */
  private readonly changeForValue = computed(() => {
    const text = this.changeForText().trim().replace(',', '.');
    const value = Number(text);
    return text && !Number.isNaN(value) ? value : null;
  });

  /** "Troco para" menor que o total do pedido. */
  protected readonly changeForInvalid = computed(() => {
    const value = this.changeForValue();
    return this.paymentType() === 'cash' && value !== null && value < this.total();
  });

  constructor() {
    this.dashboardService.getMenu().subscribe({
      next: (menu) => {
        this.store.set(menu.store);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  protected setFulfillment(type: FulfillmentType) {
    this.form.controls.fulfillment.setValue(type);
    for (const control of [
      this.form.controls.street,
      this.form.controls.number,
      this.form.controls.neighborhood,
    ]) {
      control.updateValueAndValidity();
    }
  }

  protected showError(name: 'name' | 'phone' | 'street' | 'number' | 'neighborhood' | 'payment') {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit() {
    this.form.markAllAsTouched();

    const store = this.store();
    if (
      !store ||
      !store.isOpen ||
      this.form.invalid ||
      this.changeForInvalid() ||
      !this.cart.items().length ||
      this.submitting()
    ) {
      return;
    }

    const value = this.form.getRawValue();
    const isDelivery = value.fulfillment === 'delivery';

    const request: OrderRequest = {
      fulfillment: value.fulfillment,
      customer: { name: value.name.trim(), phone: value.phone.replace(/\D/g, '') },
      address: isDelivery
        ? {
            street: value.street.trim(),
            number: value.number.trim(),
            neighborhood: value.neighborhood.trim(),
            complement: value.complement.trim(),
          }
        : null,
      payment: {
        type: value.payment as PaymentType,
        changeFor: value.payment === 'cash' ? this.changeForValue() : null,
      },
      items: this.cart.items().map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        observation: item.observation,
        selections: item.selections.map((selection) => ({
          optionId: selection.optionId,
          quantity: selection.quantity,
        })),
      })),
    };

    this.submitting.set(true);
    this.submitError.set(false);

    this.orderService.create(request).subscribe({
      next: (order) => {
        this.cart.clear();
        this.router.navigate(['/pedido', order.id]);
      },
      error: () => {
        this.submitError.set(true);
        this.submitting.set(false);
      },
    });
  }
}
