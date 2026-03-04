import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SalesReportResponse } from '../types/reportsSales';
import { ProductReport, ProductReportSummary } from '../types/reportProducts';
import { ReportExpense } from '../types/reportExpense';
import { OrderReport, OrderReportSummary } from '../types/reportOrders';
import { LocationReportResponse } from '../types/reportLocations';

const LOCATION_REPORT_MOCK: LocationReportResponse = {
  status: 'OK',
  data: {
    locations: [
      {
        id: 1,
        code: 'REST_A',
        name: 'Restaurante A',
        totalValue: 1840.5,
        topProduct: 'Cerveja Long Neck',
        categories: [
          {
            name: 'Bebidas',
            totalValue: 980.0,
            totalQty: 87,
            items: [
              { name: 'Cerveja Long Neck', qty: 42, value: 504.0, producedAt: 'Bar Central' },
              { name: 'Suco de Laranja', qty: 28, value: 280.0, producedAt: 'Bar Central' },
              { name: 'Refrigerante Lata', qty: 17, value: 196.0, producedAt: 'Bar Central' },
            ],
          },
          {
            name: 'Porções',
            totalValue: 560.5,
            totalQty: 34,
            items: [
              { name: 'Batata Frita', qty: 18, value: 270.0, producedAt: 'Cozinha Central' },
              { name: 'Frango à Passarinho', qty: 16, value: 290.5, producedAt: 'Cozinha Central' },
            ],
          },
        ],
      },
      {
        id: 2,
        code: 'REST_B',
        name: 'Restaurante B',
        totalValue: 2310.0,
        topProduct: 'Filé ao Molho Madeira',
        categories: [
          {
            name: 'Bebidas',
            totalValue: 420.0,
            totalQty: 35,
            items: [
              { name: 'Cerveja Long Neck', qty: 15, value: 180.0, producedAt: 'Bar Central' },
              { name: 'Vinho Tinto', qty: 12, value: 180.0, producedAt: 'Bar Central' },
              { name: 'Água Mineral', qty: 8, value: 60.0, producedAt: 'Bar Central' },
            ],
          },
          {
            name: 'Pratos',
            totalValue: 1890.0,
            totalQty: 54,
            items: [
              {
                name: 'Filé ao Molho Madeira',
                qty: 22,
                value: 880.0,
                producedAt: 'Cozinha Central',
              },
              { name: 'Salmão Grelhado', qty: 18, value: 720.0, producedAt: 'Cozinha Central' },
              { name: 'Risoto de Cogumelos', qty: 14, value: 290.0, producedAt: 'Cozinha Central' },
            ],
          },
        ],
      },
      {
        id: 3,
        code: 'REST_C',
        name: 'Restaurante C',
        totalValue: 950.0,
        topProduct: 'Chopp Artesanal',
        categories: [
          {
            name: 'Bebidas',
            totalValue: 720.0,
            totalQty: 96,
            items: [
              { name: 'Chopp Artesanal', qty: 54, value: 486.0, producedAt: 'Bar Central' },
              { name: 'Caipirinha', qty: 30, value: 180.0, producedAt: 'Bar Central' },
              { name: 'Refrigerante Lata', qty: 12, value: 54.0, producedAt: 'Bar Central' },
            ],
          },
          {
            name: 'Porções',
            totalValue: 230.0,
            totalQty: 12,
            items: [
              { name: 'Batata Frita', qty: 8, value: 120.0, producedAt: 'Cozinha Central' },
              { name: 'Linguiça Acebolada', qty: 4, value: 110.0, producedAt: 'Cozinha Central' },
            ],
          },
        ],
      },
    ],
  },
};

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  generateReportSales(startDate: string, endDate: string): Observable<SalesReportResponse> {
    return this.client.get<SalesReportResponse>(`${this.apiUrl}/reports/sales`, {
      params: { startDate, endDate },
    });
  }

  generateReportProducts(startDate: string, endDate: string): Observable<ProductReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.client.get<ProductReport>(`${this.apiUrl}/reports/products`, { params });
  }

  getExpensesReport(startDate: string, endDate: string): Observable<ReportExpense> {
    const params = { startDate, endDate };
    return this.client.get<ReportExpense>(`${this.apiUrl}/reports/expenses`, { params });
  }

  generateReportOrders(startDate: string, endDate: string): Observable<OrderReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.client.get<OrderReport>(`${this.apiUrl}/reports/orders`, { params });
  }

  generateReportLocations(startDate: string, endDate: string): Observable<LocationReportResponse> {
    // TODO: remover mock e descomentar chamada real quando o backend estiver pronto
    return of(LOCATION_REPORT_MOCK);

    // const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    // return this.client.get<LocationReportResponse>(`${this.apiUrl}/reports/locations`, { params });
  }
}
