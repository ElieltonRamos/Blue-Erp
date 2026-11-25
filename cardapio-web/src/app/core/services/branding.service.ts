import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { StoreInfo } from '../../features/store-info/types/store';

/** Aplica o nome e o logo da loja na aba do navegador (título e favicon). */
@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  apply(store: Pick<StoreInfo, 'name' | 'logoUrl'>) {
    this.title.setTitle(store.name);

    if (!store.logoUrl) return;

    let link = this.document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      this.document.head.appendChild(link);
    }
    link.removeAttribute('type');
    link.href = store.logoUrl;
  }
}
