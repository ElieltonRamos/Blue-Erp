import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';

export interface EmitNfceRequest {
  saleId: number;
  generateDanfe?: boolean;
}

export interface EmissionResult {
  accessKey: string;
  protocol?: string;
  xmlPath: string;
  pdfPath?: string;
  status: 'authorized' | 'rejected' | 'contingency';
  message: string;
}

export interface CancelNfceRequest {
  accessKey: string;
  justification: string;
}

export interface CancelNfceResponse {
  message: string;
  protocol?: string;
}

export interface SefazReturn {
  success: boolean;
  protocol?: string;
  message: string;
  signedXml?: string;
  statusCode?: string;
  accessKey?: string;
}

export interface ServiceStatusResponse {
  online: boolean;
  message: string;
  time?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NfceService {
  private readonly baseUrl = `${environment.apiUrl}/fiscal`;
  private readonly client = inject(HttpClient);

  emit(request: EmitNfceRequest) {
    return this.client.post<EmissionResult>(`${this.baseUrl}/nfce/emit`, request);
  }

  emitBySale(saleId: number, generateDanfe: boolean = true) {
    return this.emit({ saleId, generateDanfe });
  }

  cancel(request: CancelNfceRequest) {
    return this.client.post<CancelNfceResponse>(`${this.baseUrl}/nfce/cancel`, request);
  }

  query(accessKey: string) {
    return this.client.get<SefazReturn>(`${this.baseUrl}/nfce/query`, { params: { accessKey } });
  }

  queryServiceStatus() {
    return this.client.get<ServiceStatusResponse>(`${this.baseUrl}/sefaz/status`);
  }

  downloadPdf(accessKey: string) {
    return this.client.get(`${this.baseUrl}/nfce/pdf/${accessKey}`, { responseType: 'blob' });
  }

  formatAccessKey(key: string): string {
    if (!key || key.length !== 44) return key;
    return key.match(/.{1,4}/g)?.join(' ') || key;
  }

  validateAccessKey(key: string): boolean {
    return /^\d{44}$/.test(key);
  }
}
