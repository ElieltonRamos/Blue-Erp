import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { CompanyService } from 'src/company/company.service';
import { PrismaService } from 'src/database/prisma.service';
import {
  NFeOptions,
  NFeProduct,
} from 'src/fiscal-module/entities/fiscal-module.entity';
import { FiscalException } from 'src/fiscal-module/fiscal.exception';
import {
  PAYMENT_MAP,
  TaxSummary,
  UF_CODES,
} from './entities/sale-converter-nfe';

@Injectable()
export class SaleToNfeConverterService {
  private readonly logger = new Logger(SaleToNfeConverterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
  ) {}

  async convert(saleId: number): Promise<NFeOptions> {
    const sale = await this.findSaleWithRelations(saleId);
    const company = await this.companyService.getCompany();
    const { data: nfceNumber } =
      await this.companyService.incrementNfceNumber();

    const items = this.normalizeItems(sale);
    const taxes = this.calculateTaxes(items);
    const taxText = this.buildTaxText(taxes, company.ibptVersion);

    const cNF = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    const operatorName =
      sale.operator?.username || sale.userOperator || 'Sistema';
    const discount = this.toNumber(sale.discount, 2);

    const infoText = `${taxText} | Venda ID: ${saleId} | Operador: ${operatorName} | Desc: R$ ${discount.toFixed(2)}`;

    return {
      ide: {
        cUF: UF_CODES[company.state] || '31',
        cNF,
        natOp: 'VENDA',
        mod: '65',
        serie: company.nfceSeries,
        nNF: String(nfceNumber).padStart(9, '0'),
        dhEmi: new Date().toISOString(),
        tpNF: '1',
        idDest: '1',
        cMunFG: company.cityCode,
        tpImp: '4',
        tpEmis: '1',
        cDV: '0',
        tpAmb: company.nfceEnvironment === 'production' ? '1' : '2',
        finNFe: '1',
        indFinal: '1',
        indPres: '1',
        procEmi: '0',
        verProc: '1.0.0',
        indIntermed: '0',
      },
      emit: {
        CNPJ: company.cnpj,
        xNome: company.corporateName,
        xFant: company.tradeName,
        IE: company.stateRegistration,
        CRT: company.taxRegime,
        enderEmit: {
          xLgr: company.street,
          nro: company.number,
          xCpl: company.complement,
          xBairro: company.neighborhood,
          cMun: company.cityCode,
          xMun: company.city,
          UF: company.state,
          CEP: company.zipCode,
          cPais: '1058',
          xPais: 'BRASIL',
          fone: company.phone,
        },
      },
      dest: {
        xNome: sale.client?.name || 'CONSUMIDOR',
        CPF: sale.client?.cpf || undefined,
        enderDest: {
          xLgr: sale.client?.address || 'NAO INFORMADO',
          nro: 'S/N',
          xBairro: 'NAO INFORMADO',
          cMun: company.cityCode,
          xMun: company.city,
          UF: company.state,
          CEP: '00000000',
          cPais: '1058',
          xPais: 'BRASIL',
        },
        indIEDest: '9',
      },
      produtos: items,
      pag: {
        indPag: sale.isPaid ? '0' : '1',
        tPag: PAYMENT_MAP[sale.paymentMethod] || '99',
        xPag:
          sale.paymentMethod === 'CREDITO_LOJA' ? 'Crédito Loja' : undefined,
        vPag: this.toNumber(sale.total, 2),
      },
      infAdic: infoText,
      fonteIBPT: company.ibptVersion,
      csc: { csc: company.nfceCsc, idCSC: company.nfceCscId },
    };
  }

  private async findSaleWithRelations(saleId: number) {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: { product: true },
          orderBy: { itemNumber: 'asc' },
        },
        operator: { select: { id: true, username: true } },
        client: true,
      },
    });

    if (!sale) {
      throw new FiscalException('Sale not found', 404);
    }

    if (!sale.items || sale.items.length === 0) {
      throw new FiscalException('Sale has no items', 400);
    }

    return sale;
  }

  private normalizeItems(sale: {
    items: Array<{ product: any; [key: string]: any }>;
    cfop: string;
  }): NFeProduct[] {
    return sale.items.map((item: any, index: number) => {
      const product = item.product;
      const qCom = this.toNumber(item.quantity, 4);
      const vUnCom = this.toNumber(item.unitPrice, 4);
      const uCom = product.unit || 'UN';

      return {
        nItem: item.itemNumber ?? index + 1,
        cProd: product.code || String(product.id),
        xProd: item.xProd || product.name || 'PRODUTO SEM NOME',
        ncm: product.ncm || '0',
        cfop: item.cfop || sale.cfop || '5102',
        csosn: product.csosn || '102',
        origem: product.origin ?? 0,
        uCom,
        qCom,
        vUnCom,
        indTot: item.composesTotal ?? 1,
        uTrib: item.taxUnit || uCom,
        qTrib: this.toNumber(item.taxQuantity ?? qCom, 4),
        vUnTrib: this.toNumber(item.taxUnitPrice ?? vUnCom, 4),
        aliqFederal: this.toNumber(product.federalTaxRate ?? 13.45, 2),
        aliqEstadual: this.toNumber(product.stateTaxRate ?? 18.0, 2),
        aliqMunicipal: this.toNumber(product.municipalTaxRate ?? 0.0, 2),
        vTotTrib:
          item.totalTaxValue != null
            ? this.toNumber(item.totalTaxValue, 2)
            : null,
        pisCst: product.cstPis || '49',
        cofinsCst: product.cstCofins || '49',
        iiValor: this.toNumber(item.importTaxValue ?? 0, 2),
        iofValor: this.toNumber(item.iofValue ?? 0, 2),
      };
    });
  }

  private calculateTaxes(items: NFeProduct[]): TaxSummary {
    let totalValue = 0;
    let federalTax = 0;
    let stateTax = 0;
    let municipalTax = 0;

    for (const item of items) {
      const itemTotal = item.qCom * item.vUnCom;
      totalValue += itemTotal;
      federalTax += itemTotal * (item.aliqFederal / 100);
      stateTax += itemTotal * (item.aliqEstadual / 100);
      municipalTax += itemTotal * (item.aliqMunicipal / 100);
    }

    const totalTax = federalTax + stateTax + municipalTax;

    return {
      totalValue,
      totalTax,
      federalTax,
      stateTax,
      municipalTax,
      federalPercent: totalValue ? (federalTax / totalValue) * 100 : 0,
      statePercent: totalValue ? (stateTax / totalValue) * 100 : 0,
      municipalPercent: totalValue ? (municipalTax / totalValue) * 100 : 0,
    };
  }

  private buildTaxText(taxes: TaxSummary, ibptVersion?: string): string {
    const totalPercent = taxes.totalValue
      ? (taxes.totalTax / taxes.totalValue) * 100
      : 0;

    const base = `Tributos aproximados R$ ${taxes.totalTax.toFixed(2)} (${totalPercent.toFixed(2)}% do valor da nota) sendo R$ ${taxes.federalTax.toFixed(2)} federais, R$ ${taxes.stateTax.toFixed(2)} estaduais e R$ ${taxes.municipalTax.toFixed(2)} municipais`;

    return ibptVersion
      ? `${base}. Fonte: IBPT ${ibptVersion}`
      : `${base}. Fonte: IBPT`;
  }

  private toNumber(value: unknown, decimals: number): number {
    let n: number;
    if (value instanceof Decimal) {
      n = value.toNumber();
    } else {
      n = typeof value === 'string' ? Number(value) : Number(value ?? 0);
    }
    if (Number.isNaN(n)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  }
}
