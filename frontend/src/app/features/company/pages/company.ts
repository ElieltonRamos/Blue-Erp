import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LicenseService } from '../../../core/services/license.service';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { CompanyRegistration } from '../components/company-registration/company-registration';
import { CompanyFiscal } from '../components/company-fiscal/company-fiscal';
import { CompanyCertificate } from '../components/company-certificate/company-certificate';
import { CompanyIbpt } from '../components/company-ibpt/company-ibpt';
import { CompanyOnlineMenu } from '../components/company-online-menu/company-online-menu';
// import { CompanyRegistration } from './company-registration/company-registration';

type CompanyTabId = 'registration' | 'fiscal' | 'certificate' | 'ibpt' | 'onlineMenu';

interface CompanyTabItem {
  id: CompanyTabId;
  label: string;
  icon: string;
  proOnly: boolean;
}

@Component({
  selector: 'app-company',
  imports: [CompanyRegistration, CompanyFiscal, CompanyCertificate, CompanyIbpt, CompanyOnlineMenu],
  templateUrl: './company.html',
})
export class Company {
  private router = inject(Router);
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);

  readonly isPro = this.licenseService.getCurrentPlan() === 'pro';

  readonly tabs: CompanyTabItem[] = [
    { id: 'registration', label: 'Cadastro', icon: 'fa-building', proOnly: false },
    { id: 'fiscal', label: 'Fiscal', icon: 'fa-file-invoice', proOnly: true },
    { id: 'certificate', label: 'Certificado', icon: 'fa-shield-halved', proOnly: true },
    { id: 'ibpt', label: 'Tabela IBPT', icon: 'fa-percent', proOnly: true },
    { id: 'onlineMenu', label: 'Cardápio Online', icon: 'fa-store', proOnly: false },
  ];

  activeTab = signal<CompanyTabId>('registration');
  isDirty = signal(false);

  isDisabled(tab: CompanyTabItem): boolean {
    return tab.proOnly && !this.isPro;
  }

  changeTab(tab: CompanyTabItem): void {
    if (tab.id === this.activeTab()) return;

    if (this.isDisabled(tab)) {
      this.notification.error('Recurso disponível apenas no plano Pro');
      return;
    }

    if (this.isDirty()) {
      this.notification.error('Salve as alterações antes de trocar de aba.');
      return;
    }

    this.activeTab.set(tab.id);
  }

  onDirtyChange(dirty: boolean): void {
    this.isDirty.set(dirty);
  }

  goToMenu(): void {
    if (this.isDirty()) {
      this.notification.error('Salve as alterações antes de sair.');
      return;
    }
    this.router.navigate(['/dashboard']);
  }
}
