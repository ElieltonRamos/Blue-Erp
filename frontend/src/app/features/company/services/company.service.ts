import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';
import { Company } from '../types/company';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);
  // POST /company - Cria uma nova empresa
  createCompany(company: Company) {
    return this.client.post<Company>(`${this.apiUrl}/company`, company);
  }

  // GET /company/:id - Busca uma empresa pelo ID
  getCompanyById(id: number) {
    return this.client.get<Company>(`${this.apiUrl}/company/${id}`);
  }

  // PUT /company/:id - Atualiza dados da empresa
  updateCompany(id: number, company: Partial<Company>) {
    return this.client.put<Company>(`${this.apiUrl}/company/${id}`, company);
  }

  // DELETE /company/:id - Deleta uma empresa pelo ID
  deleteCompany(id: number) {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/company/${id}`);
  }

  // POST /company/nfceIncrement/:id - Incrementa e retorna o próximo número de NFC-e
  incrementNfceNumber(id: number) {
    return this.client.post<{ data: number }>(`${this.apiUrl}/company/nfceIncrement/${id}`, {});
  }

  // GET /company/certificado/:id - Consulta existência e info do certificado digital
  getCertificadoConfig(id: number) {
    return this.client.get<{
      existe: boolean;
      certificadoInfo?: {
        temSenha: boolean;
      };
    }>(`${this.apiUrl}/company/certificado/${id}`);
  }

  uploadCompanyCertificate(id: number, file: File, certificadoSenha: string) {
    const formData = new FormData();
    formData.append('certificado', file); // mesmo nome do campo no multer
    formData.append('certificadoSenha', certificadoSenha);

    return this.client.put<Company>(`${this.apiUrl}/company/${id}/certificate`, formData);
  }

  importIbptFromCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post<{ message: string }>(`${this.apiUrl}/ibpt/import`, formData);
  }
}
