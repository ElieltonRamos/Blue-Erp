import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';

interface UpdateEvent {
  id: number;
  change: number;
}

@Component({
  selector: 'app-table-product-modal',
  templateUrl: './table-product-modal.html',
  standalone: true,
})
export class TableProductModal {
  @Input() show = false;
  @Input() table!: any;
  @Input() products: any[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() add = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();
  @Output() update = new EventEmitter<UpdateEvent>();

  @ViewChild('productSelect') productSelect!: ElementRef<HTMLSelectElement>;

  onProductSelect(id: string) {
    const productid = Number(id);
    if (productid > 1) {
      this.add.emit(productid);
      this.productSelect.nativeElement.value = '';
    }
  }
}
