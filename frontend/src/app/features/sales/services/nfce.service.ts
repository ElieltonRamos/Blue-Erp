import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';

// Interfaces
export interface NfceEmissaoRequest {
  companyId: number;
  saleId: number;
  emitirDanfe?: boolean;
}

export interface NfceEmissaoResponse {
  chaveAcesso: string;
  protocolo?: string;
  xmlPath: string;
  pdfPath?: string;
  status: 'autorizada' | 'rejeitada' | 'contingencia';
  mensagem: string;
}

export interface RetornoSefaz {
  sucesso: boolean;
  protocolo?: string;
  mensagem: string;
  xmlAssinado?: string;
  codigoStatus?: string;
  motivoRejeicao?: string;
}

export interface StatusServicoResponse {
  online: boolean;
  mensagem: string;
  tempo?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NfceService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient)


  emitir(request: NfceEmissaoRequest) {
    return this.client.post<NfceEmissaoResponse>(
      `${this.apiUrl}/nfce/emitir`,
      request
    );
  }

  emitirPorVenda(saleId: number, companyId: number, emitirDanfe: boolean = true) {
    return this.client.post<NfceEmissaoResponse>(
      `${this.apiUrl}/nfce/emitir`,
      { saleId, companyId, emitirDanfe }
    );
  }

  consultar(companyId: number, chaveAcesso: string) {
    return this.client.get<RetornoSefaz>(
      `${this.apiUrl}/nfce/consultar/${companyId}/${chaveAcesso}`
    );
  }

  consultarStatusServico(companyId: number) {
    return this.client.get<StatusServicoResponse>(
      `${this.apiUrl}/nfce/status/${companyId}`
    );
  }

  downloadPdf(chaveAcesso: string) {
    return this.client.get(`${this.apiUrl}/nfce/download/pdf/${chaveAcesso}`, {
      responseType: 'blob',
    });
  }

  formatarChaveAcesso(chave: string): string {
    if (!chave || chave.length !== 44) {
      return chave;
    }
    return chave.match(/.{1,4}/g)?.join(' ') || chave;
  }

  validarChaveAcesso(chave: string): boolean {
    return /^\d{44}$/.test(chave);
  }
}
