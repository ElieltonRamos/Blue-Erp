import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of, switchMap, tap } from 'rxjs';
import {
  FiscalStatus,
  Sale,
  SalePaymentDto,
  UpdateSaleDto,
  UpdateSaleItemDto,
} from '../../../sales/types/sale';
import { SaleService } from '../../../sales/services/sales.service';
import { ClientService } from '../../../clients/services/client.service';
import { ProductService } from '../../../products/services/product.service';
import Client from '../../../clients/types/clients';
import { BusinessPartner } from '../../../purchases/types/business-partner';
import { BusinessPartnerService } from '../../../purchases/services/business-partner.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FiscalService } from '../../services/fiscal.service';
import { EmitNfeRequest, ModFrete, NfeVehicle, NfeVolumes } from '../../types/fiscal';
import { Cfop, CFOPS } from '../../types/cfops';

type ItemType = 'PRODUCT' | 'SERVICE';

interface EditableItem {
  id?: number;
  type: ItemType;
  productId?: number;
  serviceId?: number;
  userId?: number | null;
  xProd: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface EditablePayment {
  method: string;
  amount: number;
  dVenc?: string; // só para a nota (yyyy-MM-dd), não vai para a venda
}

interface SearchResult {
  type: ItemType;
  id: number;
  name: string;
  price: number;
}

function vehicleValidator(group: AbstractControl): ValidationErrors | null {
  const plate = group.get('plate')?.value;
  const uf = group.get('uf')?.value;
  return !!plate !== !!uf ? { vehicleIncomplete: true } : null;
}

@Component({
  selector: 'app-emit-nfe',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './emit-nfe.html',
})
export class EmitNfe implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private saleService = inject(SaleService);
  private clientService = inject(ClientService);
  private productService = inject(ProductService);
  private fiscalService = inject(FiscalService);
  private partnerService = inject(BusinessPartnerService);
  private notification = inject(NotificationService);

  readonly saleId = Number(this.route.snapshot.paramMap.get('saleId'));
  sale = signal<Sale | null>(null);
  carriers = signal<BusinessPartner[]>([]);
  loading = signal(true);
  submitting = signal(false);

  readonly inputClass =
    'w-full bg-surface-alt border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent';
  readonly cellClass =
    'w-full bg-overlay border border-border px-2 py-1 rounded text-sm text-text-primary';
  readonly labelClass = 'block text-xs text-text-secondary mb-1';
  readonly hintClass = 'text-xs text-text-muted mt-1';
  private readonly DEFAULT_CLIENT_ID = 1;

  paymentMethods = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'CREDITO_LOJA'];

  selectedClientId!: number;
  clientSearch = '';
  clientResults: Client[] = [];
  showClientResults = false;
  get clientBlocked(): boolean {
    return this.selectedClientId === this.DEFAULT_CLIENT_ID;
  }

  itemSearch = '';
  itemResults: SearchResult[] = [];
  showItemResults = false;
  private itemSearchTimer: ReturnType<typeof setTimeout> | null = null;

  cfop = '';
  cfopSearch = '';
  cfopResults: Cfop[] = [];
  showCfopResults = false;

  items: EditableItem[] = [];
  payments: EditablePayment[] = [];
  discount = 0;
  serviceCharge = 0;
  isPaid = false;
  private initialSnapshot = '';

  form = this.fb.group({
    natOp: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
    tpNF: this.fb.nonNullable.control('1'),
    finNFe: this.fb.nonNullable.control('1'),
    dhSaiEnt: this.fb.nonNullable.control(''),
    permiteCredito: this.fb.nonNullable.control(false),
    generateDanfe: this.fb.nonNullable.control(true),
    infAdic: this.fb.nonNullable.control(''),
    transp: this.fb.group({
      modFrete: this.fb.nonNullable.control('0', Validators.required),
      carrierId: this.fb.control<number | null>(null),
      vehicle: this.fb.group(
        {
          plate: this.fb.nonNullable.control(
            '',
            Validators.pattern(/^[A-Za-z]{3}-?\d[A-Za-z0-9]\d{2}$/),
          ),
          uf: this.fb.nonNullable.control('', Validators.pattern(/^[A-Za-z]{2}$/)),
        },
        { validators: vehicleValidator },
      ),
      volumes: this.fb.group({
        qVol: this.fb.control<number | null>(null, Validators.min(0)),
        esp: this.fb.nonNullable.control('', Validators.maxLength(60)),
        marca: this.fb.nonNullable.control('', Validators.maxLength(60)),
        nVol: this.fb.nonNullable.control('', Validators.maxLength(60)),
        pesoL: this.fb.control<number | null>(null, Validators.min(0)),
        pesoB: this.fb.control<number | null>(null, Validators.min(0)),
      }),
    }),
  });

  ngOnInit() {
    forkJoin({
      sale: this.saleService.getSaleById(this.saleId),
      carriers: this.partnerService.getAll({ type: 'CARRIER', active: true }),
    }).subscribe({
      next: ({ sale, carriers }) => {
        if (sale.fiscalStatus === FiscalStatus.EMITIDA && sale.fiscalKey) {
          this.notification.error('Esta venda já possui nota fiscal emitida');
          this.goBack();
          return;
        }
        this.loadSale(sale);
        if (this.clientBlocked) {
          this.notification.error(
            'Esta venda está com o cliente padrão. Troque o cliente para emitir a NF-e.',
          );
        }
        if (this.hasServices && this.productCount === 0) {
          this.notification.error(
            'Esta venda tem apenas serviços e não pode ter nota fiscal. Para nota de serviços, utilize o emissor da prefeitura da sua cidade.',
          );
          this.goBack();
          return;
        }
        this.carriers.set(carriers);
        this.loading.set(false);
      },
      error: (error) => {
        this.notification.error(error.error?.message || 'Erro ao carregar a venda');
        this.goBack();
      },
    });
  }

  private loadSale(sale: Sale) {
    this.sale.set(sale);
    this.selectedClientId = sale.clientId;
    this.clientSearch = sale.client.name;
    this.discount = Number(sale.discount);
    this.serviceCharge = Number(sale.serviceCharge);
    this.isPaid = sale.isPaid;
    this.cfop = sale.cfop;
    this.cfopSearch = sale.cfop ?? '';
    this.applyNatOp(sale.cfop);

    this.items = (sale.items ?? []).map((item) => ({
      id: item.id,
      type: item.serviceId ? 'SERVICE' : 'PRODUCT',
      productId: item.productId ?? undefined,
      serviceId: item.serviceId ?? undefined,
      userId: item.userId ?? null,
      xProd: item.xProd ?? '',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    }));

    if (!this.hasServices || this.payments.length === 0) {
      this.payments = sale.payments.map((p) => ({ method: p.method, amount: Number(p.amount) }));
    }
    this.initialSnapshot = this.snapshot();
  }

  private snapshot(): string {
    return JSON.stringify({
      clientId: this.selectedClientId,
      items: this.items,
      payments: this.hasServices
        ? null
        : this.payments.map((p) => ({ method: p.method, amount: p.amount })),
      discount: this.discount,
      serviceCharge: this.serviceCharge,
      isPaid: this.isPaid,
      cfop: this.cfop,
    });
  }

  get saleDirty(): boolean {
    return this.snapshot() !== this.initialSnapshot;
  }

  searchClients() {
    if (this.clientSearch.trim().length < 2) {
      this.clientResults = [];
      this.showClientResults = false;
      return;
    }

    this.clientService.findClientByName(this.clientSearch.trim()).subscribe({
      next: (clients) => {
        this.clientResults = clients;
        this.showClientResults = true;
      },
      error: () => this.notification.error('Erro ao buscar clientes'),
    });
  }

  selectClient(client: Client) {
    this.selectedClientId = client.id!;
    this.clientSearch = client.name;
    this.showClientResults = false;
  }

  searchCfop() {
    const term = this.cfopSearch.trim().toLowerCase();
    if (!term) {
      this.cfopResults = [];
      this.showCfopResults = false;
      return;
    }
    this.cfopResults = CFOPS.filter(
      (c) => c.code.startsWith(term) || c.natOp.toLowerCase().includes(term),
    ).slice(0, 10);
    this.showCfopResults = true;
  }

  selectCfop(c: Cfop) {
    this.cfop = c.code;
    this.cfopSearch = c.code;
    this.showCfopResults = false;
    this.applyNatOp(c.code);
  }

  selectFirstCfop() {
    if (this.cfopResults.length) this.selectCfop(this.cfopResults[0]);
  }

  onCfopBlur() {
    this.showCfopResults = false;
    if (!this.cfopSearch.trim()) {
      this.cfop = '';
      this.applyNatOp('');
    }
    this.cfopSearch = this.cfop ?? '';
  }

  onItemSearchChange() {
    if (this.itemSearchTimer) clearTimeout(this.itemSearchTimer);

    const term = this.itemSearch.trim();
    if (term.length < 2) {
      this.itemResults = [];
      this.showItemResults = false;
      return;
    }

    this.itemSearchTimer = setTimeout(() => {
      this.productService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          this.itemResults = response.data.map(
            (p): SearchResult => ({
              type: 'PRODUCT',
              id: p.id,
              name: p.name,
              price: Number(p.price),
            }),
          );
          this.showItemResults = true;
        },
        error: () => this.notification.error('Erro ao buscar produtos'),
      });
    }, 350);
  }

  selectSearchResult(result: SearchResult) {
    const existing = this.items.find((i) => i.type === 'PRODUCT' && i.productId === result.id);
    if (existing) {
      existing.quantity += 1;
      this.recalcItemTotal(existing);
    } else {
      this.items.push({
        type: 'PRODUCT',
        productId: result.id,
        xProd: result.name,
        quantity: 1,
        unitPrice: result.price,
        totalPrice: result.price,
      });
    }

    this.itemSearch = '';
    this.itemResults = [];
    this.showItemResults = false;
  }

  recalcItemTotal(item: EditableItem) {
    item.totalPrice = Number((item.quantity * item.unitPrice).toFixed(2));
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  addPayment() {
    this.payments.push({ method: 'DINHEIRO', amount: 0 });
  }

  removePayment(index: number) {
    this.payments.splice(index, 1);
  }

  get itemsTotal(): number {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get productsTotal(): number {
    return this.items
      .filter((i) => i.type === 'PRODUCT')
      .reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get servicesTotal(): number {
    return this.items
      .filter((i) => i.type === 'SERVICE')
      .reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get productCount(): number {
    return this.items.filter((i) => i.type === 'PRODUCT').length;
  }

  get serviceCount(): number {
    return this.items.filter((i) => i.type === 'SERVICE').length;
  }

  get hasServices(): boolean {
    return this.serviceCount > 0;
  }

  get totalAfterDiscount(): number {
    return this.itemsTotal - this.discount + this.serviceCharge;
  }

  get paymentsTarget(): number {
    return this.hasServices ? this.productsTotal : this.totalAfterDiscount;
  }

  get paymentsTotal(): number {
    return this.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  get paymentsMismatch(): boolean {
    return Math.abs(this.paymentsTotal - this.paymentsTarget) > 0.01;
  }

  get paymentsDifference(): number {
    return Number((this.paymentsTarget - this.paymentsTotal).toFixed(2));
  }

  money(n: unknown): string {
    const num = Number(n);
    return (isNaN(num) ? 0 : num).toFixed(2);
  }

  goBack() {
    this.router.navigate(['/fiscal']);
  }

  private validateSale(): string | null {
    if (this.clientBlocked) {
      return 'NF-e exige destinatário identificado. Troque o cliente da venda (o cliente padrão não é permitido).';
    }
    if (!this.selectedClientId) return 'Selecione um cliente.';
    if (this.items.length === 0) return 'A venda precisa ter ao menos um item.';
    if (this.payments.length === 0) return 'A venda precisa ter ao menos um pagamento.';
    if (this.paymentsMismatch) {
      const label = this.hasServices ? 'dos produtos (nota)' : 'da venda';
      return `O total de pagamentos (R$ ${this.money(this.paymentsTotal)}) não confere com o total ${label} (R$ ${this.money(this.paymentsTarget)}).`;
    }
    return null;
  }

  private salePayments(): EditablePayment[] {
    if (!this.hasServices) return this.payments;
    return (this.sale()?.payments ?? []).map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    }));
  }

  private buildSaleDto(): UpdateSaleDto {
    const items: UpdateSaleItemDto[] = this.items.map((item) => ({
      id: item.id,
      type: item.type,
      productId: item.productId,
      serviceId: item.serviceId,
      userId: item.userId ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const payments: SalePaymentDto[] = this.salePayments().map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    }));

    return {
      clientId: this.selectedClientId,
      items,
      payments,
      discount: this.discount,
      serviceCharge: this.serviceCharge,
      isPaid: this.isPaid,
      cfop: this.cfop,
    };
  }

  private saveSaleIfChanged(): Observable<unknown> {
    if (!this.saleDirty) return of(null);
    return this.saleService.updateSale(this.saleId, this.buildSaleDto()).pipe(
      switchMap(() => this.saleService.getSaleById(this.saleId)),
      tap((sale) => this.loadSale(sale)),
    );
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const saleError = this.validateSale();
    if (saleError) {
      this.notification.error(saleError);
      return;
    }

    this.submitting.set(true);
    const request = this.buildRequest(); // montado antes de salvar: loadSale() recarrega os pagamentos

    this.saveSaleIfChanged().subscribe({
      next: () => this.emit(request),
      error: (error) => {
        this.submitting.set(false);
        this.notification.error(
          `Erro ao salvar a venda:\n${error.error?.message || error.message || 'Erro desconhecido'}`,
        );
      },
    });
  }

  private emit(request: EmitNfeRequest) {
    this.fiscalService.emitNfe(request).subscribe({
      next: (res) => {
        this.notification.success(`NF-e autorizada com sucesso!\nChave: ${res.accessKey}`);
        if (res.pdfPath) {
          this.downloadDanfe(res.accessKey);
        }
        this.goBack();
      },
      error: (error) => {
        this.submitting.set(false);
        this.notification.error(
          `Erro ao emitir NF-e:\n${error.error?.message || error.message || 'Erro desconhecido'}`,
        );
      },
    });
  }

  private downloadDanfe(accessKey: string) {
    this.fiscalService.downloadPdf(accessKey).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${accessKey}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notification.error('Erro ao baixar o DANFE'),
    });
  }

  private compact<T extends object>(obj: T): Partial<T> | undefined {
    const entries = Object.entries(obj).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined,
    );
    return entries.length ? (Object.fromEntries(entries) as Partial<T>) : undefined;
  }

  private buildCobr(): EmitNfeRequest['cobr'] {
    const dup = this.payments
      .filter((p) => p.dVenc)
      .map((p, i) => ({
        nDup: String(i + 1).padStart(3, '0'),
        dVenc: p.dVenc as string,
        vDup: Number(p.amount),
      }));
    if (!dup.length) return undefined;

    const total = Number(dup.reduce((s, d) => s + d.vDup, 0).toFixed(2));
    return {
      fat: { nFat: String(this.saleId), vOrig: total, vLiq: total },
      dup,
    } as EmitNfeRequest['cobr'];
  }

  private applyNatOp(code: string | null | undefined) {
    const found = CFOPS.find((c) => c.code === code);
    this.form.controls.natOp.setValue(found ? found.natOp.slice(0, 60) : '');
    this.form.controls.natOp.markAsDirty();
  }

  private buildRequest(): EmitNfeRequest {
    const v = this.form.getRawValue();

    const vehicle = this.compact(v.transp.vehicle) as NfeVehicle | undefined;
    const volumes = this.compact(v.transp.volumes) as NfeVolumes | undefined;

    return {
      saleId: this.saleId,
      generateDanfe: v.generateDanfe,
      natOp: v.natOp,
      tpNF: (v.tpNF || undefined) as EmitNfeRequest['tpNF'],
      finNFe: (v.finNFe || undefined) as EmitNfeRequest['finNFe'],
      dhSaiEnt: v.dhSaiEnt ? new Date(v.dhSaiEnt).toISOString() : undefined,
      permiteCredito: v.permiteCredito || undefined,
      transp: {
        modFrete: v.transp.modFrete as ModFrete,
        carrierId: v.transp.carrierId ?? undefined,
        vehicle,
        volumes,
      },
      cobr: this.buildCobr(),
      infAdic: v.infAdic || undefined,
      omitServices: this.hasServices || undefined,
      payments: this.hasServices
        ? this.payments.map((p) => ({ method: p.method, amount: Number(p.amount) }))
        : undefined,
    };
  }
}
