import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-menu',
  imports: [CommonModule],
  templateUrl: './card-menu.html',
})
export class CardMenu {
  private router = inject(Router)
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() path: string = '';
  @Input() isActive: boolean = true;

  navigateTo(path: string) {
    return this.router.navigate([path]);
  }
}
