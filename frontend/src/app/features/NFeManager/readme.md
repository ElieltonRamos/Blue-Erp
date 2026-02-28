# Módulo Fiscal — Frontend Angular

## Visão Geral

O módulo fiscal é composto por duas páginas principais:

- **Gestão de Notas** (`/fiscal/notas`) — operações por nota fiscal
- **Relatório Fiscal** (`/fiscal/relatorio`) — consolidado para o contador

---

## Estrutura de Arquivos Sugerida

```
src/app/modules/fiscal/
├── fiscal.module.ts
├── fiscal-routing.module.ts
├── services/
│   └── fiscal.service.ts
├── models/
│   └── fiscal.models.ts
├── pages/
│   ├── notas/
│   │   ├── notas.component.ts
│   │   ├── notas.component.html
│   │   └── notas.component.scss
│   └── relatorio/
│       ├── relatorio.component.ts
│       ├── relatorio.component.html
│       └── relatorio.component.scss
└── components/
    ├── status-sefaz-badge/
    │   └── status-sefaz-badge.component.ts
    └── nota-actions/
        └── nota-actions.component.ts
```

---

## Models

```typescript
// fiscal.models.ts

export interface NotaFiscal {
  id: number;
  fiscalKey: string;           // chave de acesso 44 dígitos
  fiscalProtocol: string;
  fiscalStatus: 'PENDENTE' | 'EMITIDA' | 'CANCELADA' | 'ERRO';
  fiscalEmitDate: string;
  fiscalXml: string;           // XML salvo na venda (LongText)
  total: number;
  nNF: number;                 // número da nota
  date: string;
  clientName: string;
  paymentMethod: string;
}

export interface SefazStatus {
  online: boolean;
  status: string;
  message: string;
  checkedAt: string;
}

export interface RevenueReport {
  period: string;              // YYYY-MM
  totalRevenue: number;
  totalNotes: number;
  canceledNotes: number;
  canceledValue: number;
  byCfop: CfopGroup[];
  byNcm: NcmGroup[];
}

export interface CfopGroup {
  cfop: string;
  description: string;
  totalValue: number;
  count: number;
}

export interface NcmGroup {
  ncm: string;
  totalValue: number;
  count: number;
}
```

---

## Service

```typescript
// fiscal.service.ts

@Injectable({ providedIn: 'root' })
export class FiscalService {
  private readonly base = '/fiscal';

  // Status do SEFAZ
  getSefazStatus(): Observable<SefazStatus> {
    return this.http.get<SefazStatus>(`${this.base}/sefaz/status`);
  }

  // Listar notas (endpoint a criar no backend)
  getNotas(params: { startDate?: string; endDate?: string; status?: string }): Observable<NotaFiscal[]> {
    return this.http.get<NotaFiscal[]>(`${this.base}/nfce/list`, { params });
  }

  // Cancelar nota
  cancelNota(accessKey: string, justification: string): Observable<any> {
    return this.http.post(`${this.base}/nfce/cancel`, { accessKey, justification });
  }

  // Download PDF via backend
  downloadPdf(accessKey: string): Observable<Blob> {
    return this.http.get(`${this.base}/nfce/pdf/${accessKey}`, { responseType: 'blob' });
  }

  // Reemitir PDF a partir do XML salvo na venda (endpoint a criar no backend)
  reemitirPdf(saleId: number): Observable<Blob> {
    return this.http.get(`${this.base}/nfce/reprint/${saleId}`, { responseType: 'blob' });
  }

  // Download XML salvo
  downloadXml(saleId: number): Observable<Blob> {
    return this.http.get(`${this.base}/nfce/xml/${saleId}`, { responseType: 'blob' });
  }

  // Consultar nota na SEFAZ
  queryNota(accessKey: string): Observable<any> {
    return this.http.get(`${this.base}/nfce/query`, { params: { accessKey } });
  }

  // Relatório consolidado (endpoint a criar no backend)
  getRevenueReport(month: string, year: string): Observable<RevenueReport> {
    return this.http.get<RevenueReport>(`${this.base}/reports/revenue`, { params: { month, year } });
  }

  // Exportar relatório CSV
  exportCsv(month: string, year: string): Observable<Blob> {
    return this.http.get(`${this.base}/reports/export`, { params: { month, year }, responseType: 'blob' });
  }
}
```

---

## Página 1 — Gestão de Notas (`/fiscal/notas`)

### Funcionalidades

- Badge de status do SEFAZ no topo (polling a cada 5 minutos)
- Filtros: período (data início/fim), status da nota
- Tabela de notas com colunas:
  - Número NF | Data | Cliente | Valor | Status | Ações
- Ações por nota:
  - **Cancelar** — abre modal com campo de justificativa (mínimo 15 caracteres, exigência SEFAZ)
  - **Baixar PDF** — consome `GET /fiscal/nfce/pdf/{accessKey}`
  - **Reemitir PDF** — gera PDF a partir do XML salvo na venda (não requer conexão SEFAZ)
  - **Baixar XML** — download do XML salvo
  - **Consultar SEFAZ** — consulta status atual da nota na SEFAZ

### Observações de Implementação

```typescript
// Polling status SEFAZ
ngOnInit() {
  this.checkSefazStatus();
  this.sefazInterval = setInterval(() => this.checkSefazStatus(), 5 * 60 * 1000);
}

ngOnDestroy() {
  clearInterval(this.sefazInterval);
}

// Download de arquivo Blob
downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Regras de Negócio

- Cancelamento só é permitido para notas com status `EMITIDA`
- Prazo de cancelamento: até 30 minutos após emissão (validar no backend)
- Justificativa de cancelamento: mínimo 15 caracteres (requisito SEFAZ)
- Reemissão de PDF não altera status da nota, apenas regera o documento a partir do XML

---

## Página 2 — Relatório Fiscal (`/fiscal/relatorio`)

### Funcionalidades

- Seletor de mês/ano
- Cards de resumo:
  - Receita Bruta do período
  - Quantidade de notas emitidas
  - Quantidade de notas canceladas
  - Valor cancelado
- Tabela por CFOP com totais
- Tabela por NCM com totais
- Botão exportar CSV

### CFOPs Esperados no Sistema

| CFOP | Descrição |
|------|-----------|
| 5101 | Venda de produção própria (MANUFACTURED) |
| 5102 | Venda de mercadoria adquirida para revenda (RESALE) |
| 5405 | Venda com ICMS ST retido anteriormente (CSOSN 500) |

---

## Endpoints Existentes no Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/fiscal/nfce/emit` | Emitir NFC-e |
| POST | `/fiscal/nfce/cancel` | Cancelar NFC-e |
| GET | `/fiscal/nfce/query` | Consultar NFC-e por chave |
| GET | `/fiscal/nfce/pdf/{accessKey}` | Download PDF |
| GET | `/fiscal/sefaz/status` | Status do SEFAZ |

## Endpoints a Criar no Backend

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/fiscal/nfce/list` | Listar notas com filtros |
| GET | `/fiscal/nfce/xml/{saleId}` | Download XML salvo na venda |
| GET | `/fiscal/nfce/reprint/{saleId}` | Reemitir PDF do XML salvo |
| GET | `/fiscal/reports/revenue` | Relatório de receita por período |
| GET | `/fiscal/reports/export` | Export CSV do relatório |

---

## Notas Fiscais — Estrutura no Banco

Os dados relevantes estão na tabela `sales`:

```
fiscalStatus   → PENDENTE | EMITIDA | CANCELADA | ERRO
fiscalKey      → chave de acesso 44 dígitos
fiscalProtocol → protocolo de autorização SEFAZ
fiscalEmitDate → data/hora de emissão
fiscalXml      → XML completo (LongText) — base para reemissão de PDF
```

---

## Considerações para o Contador

O sistema disponibiliza:

- XML de cada nota (base documental para PGDAS e sistema contábil)
- Relatório de receita bruta mensal por CFOP e NCM
- Chaves de acesso para conferência direta na SEFAZ

O contador é responsável por:

- Cálculo e recolhimento do DAS via PGDAS-D
- SPED Fiscal / ECF / ECD
- Apuração do Simples Nacional (Anexo II para produtos MANUFACTURED)
```