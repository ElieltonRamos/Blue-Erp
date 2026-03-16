/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import { nowBrasilia, toSefazDateTime } from 'src/common/date-utils';

const CARD_PAYMENT_METHODS = ['CARTAO_CREDITO', 'CARTAO_DEBITO'];

@Injectable()
export class SaleToNfeConverterService {
  private readonly logger = new Logger(SaleToNfeConverterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
  ) {}

  async convert(saleId: number, nfceNumber: number): Promise<NFeOptions> {
    const sale = await this.findSaleWithRelations(saleId);
    const company = await this.companyService.getCompany();
    const cscConfig = await this.companyService.getCscConfig();
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
        dhEmi: toSefazDateTime(nowBrasilia()),
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
        ...(CARD_PAYMENT_METHODS.includes(sale.paymentMethod) && {
          card: {
            tpIntegra: '2',
            tBand: '99',
            cAut: '000000',
          },
        }),
      },
      infAdic: infoText,
      fonteIBPT: company.ibptVersion,
      csc: { csc: cscConfig.nfceCsc, idCSC: cscConfig.nfceCscId },
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
        ncm: product.ncm || null,
        cfop:
          item.cfop ||
          this.resolveCfop(
            product.csosn,
            sale.cfop,
            product.productType === 'MANUFACTURED',
          ),
        csosn: product.csosn || '102',
        origem: product.origin ?? 0,
        uCom,
        qCom,
        vUnCom,
        indTot: item.composesTotal ?? 1,
        uTrib: item.taxUnit || uCom,
        qTrib: this.toNumber(item.taxQuantity ?? qCom, 4),
        vUnTrib: this.toNumber(item.taxUnitPrice ?? vUnCom, 4),
        aliqFederal:
          product.federalTaxRate != null
            ? this.toNumber(product.federalTaxRate, 2)
            : null,
        aliqEstadual:
          product.stateTaxRate != null
            ? this.toNumber(product.stateTaxRate, 2)
            : null,
        aliqMunicipal:
          product.municipalTaxRate != null
            ? this.toNumber(product.municipalTaxRate, 2)
            : null,
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

  private resolveCfop(
    csosn: string | null,
    saleCfop: string,
    isManufactured: boolean = false,
  ): string {
    switch (csosn) {
      case '500':
        return '5405';
      case '102':
      case '400':
        return isManufactured ? '5101' : saleCfop || '5102';
      default:
        return isManufactured ? '5101' : saleCfop || '5102';
    }
  }

  private calculateTaxes(items: NFeProduct[]): TaxSummary {
    let totalValue = 0;
    let federalTax = 0;
    let stateTax = 0;
    let municipalTax = 0;

    for (const item of items) {
      if (!item.ncm || item.ncm === '0' || item.ncm === '00000000') {
        throw new FiscalException(
          `Produto "${item.xProd}" (ID: ${item.cProd}) não possui NCM cadastrado. Emissão bloqueada.`,
        );
      }

      if (
        item.aliqFederal == null ||
        item.aliqEstadual == null ||
        item.aliqMunicipal == null
      ) {
        throw new FiscalException(
          `Produto "${item.xProd}" (NCM: ${item.ncm}) sem alíquota IBPT calculada. Atualize a tabela IBPT ou verifique o NCM cadastrado. Emissão bloqueada.`,
        );
      }

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

    const base =
      `Tributos aproximados R$ ${taxes.totalTax.toFixed(2)}` +
      ` (${totalPercent.toFixed(2)}% do valor da nota)` +
      ` sendo R$ ${taxes.federalTax.toFixed(2)} federais,` +
      ` R$ ${taxes.stateTax.toFixed(2)} estaduais` +
      ` e R$ ${taxes.municipalTax.toFixed(2)} municipais`;

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
