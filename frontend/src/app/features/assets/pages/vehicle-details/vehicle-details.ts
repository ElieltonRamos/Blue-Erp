import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetMaintenanceHistory, MaintenanceDocument } from '../../types/asset.type';
import { DocumentService } from '../../../documents/services/document.service';
import { OSDocument, DOCUMENT_STATUS_LABELS } from '../../../documents/types/documents.types';
import { DocumentDetailComponent } from '../../../documents/components/document-detail/document-detail.component';
import { UserService } from '../../../users/services/user.service';
import User from '../../../users/types/user';

const ATTRIBUTE_LABELS: Record<string, string> = {
  marca: 'Marca',
  modelo: 'Modelo',
  ano: 'Ano',
  km: 'Km',
};

@Component({
  selector: 'app-vehicle-details',
  imports: [CommonModule, DocumentDetailComponent],
  templateUrl: './vehicle-details.html',
})
export class VehicleDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private assetService = inject(AssetService);
  private documentService = inject(DocumentService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  statusLabels = DOCUMENT_STATUS_LABELS;
  attributeLabels = ATTRIBUTE_LABELS;

  assetId!: number;
  asset: Asset | null = null;
  history: AssetMaintenanceHistory | null = null;
  loading = true;

  users: User[] = [];
  allUsers: User[] = [];

  selectedDocument: OSDocument | null = null;

  ngOnInit() {
    this.assetId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAsset();
    this.loadHistory();
    this.loadUsers();
    this.loadAllUsers();
  }

  goBack() {
    this.router.navigate(['/veiculos']);
  }

  private loadAsset() {
    this.assetService.getById(this.assetId).subscribe({
      next: (asset) => {
        this.asset = asset;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar veículo: ${e.error?.message || e.message}`);
      },
    });
  }

  private loadHistory() {
    this.loading = true;
    this.assetService.getMaintenanceHistory(this.assetId).subscribe({
      next: (history) => {
        this.history = history;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loading = false;
        this.notification.error(
          `Erro ao buscar histórico de manutenção: ${e.error?.message || e.message}`,
        );
      },
    });
  }

  private loadUsers() {
    this.userService.getUsers({ role: 'mechanic' }).subscribe({
      next: (users) => {
        this.users = users;
        this.cdr.detectChanges();
      },
      error: () => {
        this.users = [];
      },
    });
  }

  private loadAllUsers() {
    this.userService.getUsers({ active: true }).subscribe({
      next: (users) => {
        this.allUsers = users;
        this.cdr.detectChanges();
      },
      error: () => {
        this.allUsers = [];
      },
    });
  }

  getAttributeLabel(key: string): string {
    return this.attributeLabels[key] || key;
  }

  openDocument(doc: MaintenanceDocument) {
    this.documentService.getById(doc.id).subscribe({
      next: (document) => {
        this.selectedDocument = document;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao abrir documento: ${e.error?.message || e.message}`);
      },
    });
  }

  closeDocument() {
    this.selectedDocument = null;
  }

  onDocumentChanged(document: OSDocument) {
    this.selectedDocument = document;
    this.loadHistory();
  }
}
