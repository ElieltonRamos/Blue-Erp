import { Injectable, Logger } from '@nestjs/common';
import type {
  BusinessPartner,
  Client,
  Product,
  SaleItem,
} from '../../generated/prisma/client';
import { nowBrasilia, toSefazDateTime } from '../common/date-utils';
import { PrismaService } from '../database/prisma.service';
import { CompanyService } from '../features/company/company.service';
import type {
  Nfe55Ipi,
  Nfe55Item,
  Nfe55Options,
  Nfe55PisCofins,
} from '../features/fiscal-module/entities/nfe.entity';
import { FiscalException } from '../features/fiscal-module/fiscal.exception';
import { PAYMENT_MAP, UF_CODES } from './entities/sale-converter-nfe';
import {
  digits,
  distributeDiscount,
  round2,
  toNumber,
  toTransporta,
} from './sale-converter-nf.utils';
import { EmitNfeDto } from '../features/fiscal-module/dto/emit-nfe.dto';
import {
  buildCreditIcms,
  creditInfoNote,
  resolveCsosn,
  toGtin,
} from '../features/fiscal-module/lib/nfe-utils';

const CARD_PAYMENT_METHODS = ['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX'];

type SaleItemWithProduct = SaleItem & { product: Product | null };

type BaseItem = Omit<Nfe55Item, 'vDesc' | 'icms' | 'ipi' | 'pis' | 'cofins'> & {
  product: Product;
};

@Injectable()
export class SaleConverterNFeService {
  private readonly logger = new Logger(SaleConverterNFeService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
  ) {}

  async convert(dto: EmitNfeDto, nfeNumber: number): Promise<Nfe55Options> {
    this.logger.debug(
      `convert: dto.permiteCredito=${JSON.stringify(dto.permiteCredito)}`,
    );
    const omitServices = dto.omitServices === true;

    const sale = await this.findSale(dto.saleId, omitServices);
    const company = await this.companyService.getCompany();

    const allowCredit = dto.permiteCredito === true;
    const creditRate = allowCredit ? toNumber(company.simplesCreditRate, 2) : 0;
    if (allowCredit && creditRate <= 0) {
      throw new FiscalException(
        'Operação com crédito de ICMS, mas a empresa não tem alíquota de crédito (simplesCreditRate) configurada',
      );
    }

    const dest = this.buildDest(sale.client);
    if (allowCredit && dest.indIEDest === '9') {
      throw new FiscalException(
        'Crédito de ICMS (CSOSN 101) não é permitido para destinatário não contribuinte',
      );
    }

    const baseItems = sale.items.map((item) =>
      this.toBaseItem(item, sale.cfop, allowCredit, omitServices),
    );

    // venda com serviços: desconto da venda não é aplicado à nota
    const discount = omitServices ? 0 : toNumber(sale.discount, 2);
    const totalProd = round2(
      baseItems.reduce((sum, i) => sum + round2(i.qCom * i.vUnCom), 0),
    );
    if (discount > totalProd) {
      throw new FiscalException(
        `Desconto da venda (R$ ${discount.toFixed(2)}) maior que o total dos itens (R$ ${totalProd.toFixed(2)})`,
      );
    }

    const produtos = distributeDiscount(baseItems, discount).map((item) =>
      this.finalizeItem(item, creditRate),
    );

    const totalCredit = round2(
      produtos.reduce((sum, p) => sum + Number(p.icms?.vCredICMSSN ?? 0), 0),
    );

    // TODO: incluir o texto de tributos aproximados (IBPT) em infAdic, como na NFC-e
    const infAdic =
      [
        dto.infAdic?.trim(),
        totalCredit > 0 ? creditInfoNote(creditRate, totalCredit) : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    const carrier = await this.findCarrier(dto.transp.carrierId);

    const cUF = UF_CODES[company.state];
    if (!cUF) {
      throw new FiscalException(`UF da empresa inválida: "${company.state}"`);
    }

    const cNF = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');

    const payments = omitServices
      ? this.resolveNotePayments(dto)
      : sale.payments.map((p) => ({
          method: p.method,
          amount: round2(toNumber(p.amount, 2) - toNumber(p.change, 2)),
        }));

    const totalNota = round2(
      produtos.reduce(
        (s, p) =>
          s + round2(p.qCom * p.vUnCom) - (p.vDesc ?? 0) + (p.vOutro ?? 0),
        0,
      ),
    );
    const totalPag = round2(payments.reduce((s, p) => s + p.amount, 0));

    if (Math.abs(totalPag - totalNota) > 0.01) {
      throw new FiscalException(
        `Pagamentos (R$ ${totalPag.toFixed(2)}) não conferem com o total da nota (R$ ${totalNota.toFixed(2)})`,
      );
    }

    return {
      ide: {
        cUF,
        cNF,
        natOp: dto.natOp,
        serie: company.nfeSeries,
        nNF: String(nfeNumber).padStart(9, '0'),
        dhEmi: toSefazDateTime(nowBrasilia()),
        ...(dto.dhSaiEnt && {
          dhSaiEnt: toSefazDateTime(new Date(dto.dhSaiEnt)),
        }),
        tpNF: dto.tpNF ?? '1',
        idDest: sale.client.state?.toUpperCase() === company.state ? '1' : '2',
        cMunFG: company.cityCode,
        tpImp: '1',
        tpEmis: '1',
        tpAmb: company.nfeEnvironment === 'production' ? '1' : '2',
        finNFe: dto.finNFe ?? '1',
        indFinal: dest.indIEDest === '9' ? '1' : '0',
        indPres: '1',
        procEmi: '0',
        verProc: '1.0.0',
      },
      emit: {
        CNPJ: digits(company.cnpj),
        xNome: company.corporateName,
        xFant: company.tradeName,
        IE: company.stateRegistration,
        CRT: company.taxRegime,
        enderEmit: {
          xLgr: company.street,
          nro: company.number,
          xCpl: company.complement ?? undefined,
          xBairro: company.neighborhood,
          cMun: company.cityCode,
          xMun: company.city,
          UF: company.state,
          CEP: digits(company.zipCode),
          cPais: '1058',
          xPais: 'BRASIL',
          fone: digits(company.phone),
        },
      },
      dest,
      produtos,
      transp: this.buildTransp(dto, carrier),
      ...this.buildCobr(dto),
      pag: {
        detPag: payments.map((p) => {
          const card = this.buildCard(p.method);
          return {
            indPag: sale.isPaid ? '0' : '1',
            tPag: PAYMENT_MAP[p.method] || '99',
            xPag: p.method === 'CREDITO_LOJA' ? 'Crédito Loja' : undefined,
            vPag: p.amount,
            ...(card && { card }),
          };
        }),
      },
      infAdic,
    };
  }

  private buildCard(method: string): Record<string, string> | undefined {
    if (!CARD_PAYMENT_METHODS.includes(method)) return undefined;

    return method === 'PIX'
      ? { tpIntegra: '2' }
      : { tpIntegra: '2', tBand: '99', cAut: '000000' };
  }

  private async findSale(saleId: number, omitServices = false) {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: { product: true },
          orderBy: { itemNumber: 'asc' },
        },
        client: true,
        payments: true,
      },
    });

    if (!sale) throw new FiscalException('Sale not found', 404);

    if (omitServices) {
      // nItem da NF-e precisa ser sequencial (1..N), sem lacunas
      sale.items = sale.items
        .filter((i) => i.serviceId == null)
        .map((i, idx) => ({ ...i, itemNumber: idx + 1 }));
    }

    if (!sale.items.length) throw new FiscalException('Sale has no items', 400);

    return sale;
  }
  private async findCarrier(
    carrierId?: number,
  ): Promise<BusinessPartner | null> {
    if (!carrierId) return null;

    const carrier = await this.prisma.client.businessPartner.findFirst({
      where: { id: carrierId, type: 'CARRIER' },
    });
    if (!carrier) {
      throw new FiscalException(
        `Transportadora ${carrierId} não encontrada`,
        404,
      );
    }
    return carrier;
  }

  private toBaseItem(
    item: SaleItemWithProduct,
    saleCfop: string,
    allowCredit: boolean,
    omitServices: boolean,
  ): BaseItem {
    const product = item.product;
    if (!product) {
      throw new FiscalException(
        `Item ${item.itemNumber} sem produto: NF-e modelo 55 não emite serviço`,
      );
    }

    const xProd = item.xProd || product.name;
    const label = `Item ${item.itemNumber} "${xProd}"`;

    const ncm = digits(product.ncm);
    if (ncm.length !== 8 || /^0+$/.test(ncm)) {
      throw new FiscalException(`${label} sem NCM válido no cadastro`);
    }

    let csosn: string;
    this.logger.debug(
      `toBaseItem: allowCredit=${allowCredit} csosn=${product.csosn}`,
    );
    try {
      csosn = resolveCsosn(product.csosn, allowCredit);
    } catch (error) {
      throw new FiscalException(
        `${label}: ${error instanceof Error ? error.message : 'CSOSN inválido'}`,
      );
    }

    const uCom = product.unit || 'UN';
    const qCom = toNumber(item.quantity, 4);
    const vUnCom = toNumber(item.unitPrice, 4);
    const gtin = toGtin(product.code);
    const vOutro = omitServices ? 0 : toNumber(item.serviceCharge, 2);

    return {
      product,
      nItem: item.itemNumber,
      cProd: product.code || String(product.id),
      xProd,
      ncm,
      ...(product.cest && { cest: digits(product.cest) }),
      ...(gtin && { gtin, gtinTrib: gtin }),
      cfop: item.cfop || saleCfop,
      uCom,
      qCom,
      vUnCom,
      uTrib: item.taxUnit || uCom,
      qTrib: toNumber(item.taxQuantity ?? qCom, 4),
      vUnTrib: toNumber(item.taxUnitPrice ?? vUnCom, 4),
      ...(vOutro > 0 && { vOutro }),
      indTot: String(item.composesTotal),
      ...(item.totalTaxValue != null && {
        vTotTrib: toNumber(item.totalTaxValue, 2),
      }),
      origem: product.origin,
      csosn,
    };
  }

  private finalizeItem(
    item: BaseItem & { vDesc: number },
    creditRate: number,
  ): Nfe55Item {
    const { product, ...rest } = item;
    const vProd = round2(item.qCom * item.vUnCom);
    const base = round2(vProd - item.vDesc);
    const ipi = this.buildIpi(product, base);

    return {
      ...rest,
      ...(item.csosn === '101' && {
        icms: buildCreditIcms(vProd, creditRate),
      }),
      ...(ipi && { ipi }),
      pis: this.buildPisCofins(product.cstPis, product.pisRate, base),
      cofins: this.buildPisCofins(product.cstCofins, product.cofinsRate, base),
    };
  }

  private buildIpi(product: Product, base: number): Nfe55Ipi | undefined {
    if (!product.ipiCst) return undefined;

    if (!product.ipiEnqCode) {
      throw new FiscalException(
        `Produto "${product.name}" tem CST de IPI sem código de enquadramento (cEnq)`,
      );
    }

    return {
      cEnq: product.ipiEnqCode,
      cst: product.ipiCst,
      ...(product.ipiRate != null && {
        vBC: base,
        pIPI: toNumber(product.ipiRate, 2),
      }),
    };
  }

  private buildPisCofins(
    cst: string | null,
    rate: unknown,
    base: number,
  ): Nfe55PisCofins {
    return {
      cst: cst || '49',
      ...(rate != null && { vBC: base, aliq: toNumber(rate, 2) }),
    };
  }

  private buildDest(client: Client): Nfe55Options['dest'] {
    const clean = (value?: string | null) => (value ?? '').trim();

    const cnpj = digits(client.cnpj);
    const cpf = digits(client.cpf);
    if (cnpj.length !== 14 && cpf.length !== 11) {
      throw new FiscalException(
        `Cliente "${client.name}" sem CNPJ/CPF válido no cadastro`,
      );
    }

    const cep = digits(client.zipCode);
    const missing = [
      !clean(client.street) && 'logradouro',
      !clean(client.number) && 'número',
      !clean(client.neighborhood) && 'bairro',
      !clean(client.cityCode) && 'código do município',
      !clean(client.city) && 'município',
      !clean(client.state) && 'UF',
      cep.length !== 8 && 'CEP (8 dígitos)',
    ].filter(Boolean);
    if (missing.length) {
      throw new FiscalException(
        `Cliente "${client.name}" com endereço incompleto: ${missing.join(', ')}`,
      );
    }

    const indIEDest = client.ieIndicator;
    if (!indIEDest || !['1', '2', '9'].includes(indIEDest)) {
      throw new FiscalException(
        `Cliente "${client.name}" sem indicador de IE (1, 2 ou 9) no cadastro`,
      );
    }

    const ie = digits(client.stateRegistration);
    if (indIEDest === '1' && !ie) {
      throw new FiscalException(
        `Cliente "${client.name}" é contribuinte de ICMS, mas está sem inscrição estadual`,
      );
    }

    return {
      ...(cnpj.length === 14 ? { CNPJ: cnpj } : { CPF: cpf }),
      xNome: client.name,
      enderDest: {
        xLgr: clean(client.street),
        nro: clean(client.number),
        ...(clean(client.complement) && { xCpl: clean(client.complement) }),
        xBairro: clean(client.neighborhood),
        cMun: clean(client.cityCode),
        xMun: clean(client.city),
        UF: clean(client.state).toUpperCase(),
        CEP: cep,
        cPais: '1058',
        xPais: 'BRASIL',
      },
      indIEDest,
      ...(indIEDest === '1' && { IE: ie }),
    };
  }

  private resolveNotePayments(
    dto: EmitNfeDto,
  ): { method: string; amount: number }[] {
    if (!dto.payments?.length) {
      throw new FiscalException(
        'Venda com serviços: informe os pagamentos da nota (omitServices)',
      );
    }
    return dto.payments.map((p) => ({
      method: p.method,
      amount: round2(p.amount),
    }));
  }

  private buildTransp(
    dto: EmitNfeDto,
    carrier: BusinessPartner | null,
  ): Nfe55Options['transp'] {
    const { modFrete, vehicle, volumes } = dto.transp;

    return {
      modFrete,
      ...(carrier && { transporta: toTransporta(carrier) }),
      ...(vehicle && {
        veicTransp: {
          placa: vehicle.plate.replace('-', '').toUpperCase(),
          UF: vehicle.uf.toUpperCase(),
          ...(carrier?.rntc && { RNTC: carrier.rntc }),
        },
      }),
      ...(volumes && {
        vol: {
          ...(volumes.qVol != null && { qVol: String(volumes.qVol) }),
          ...(volumes.esp && { esp: volumes.esp }),
          ...(volumes.marca && { marca: volumes.marca }),
          ...(volumes.nVol && { nVol: volumes.nVol }),
          ...(volumes.pesoL != null && { pesoL: volumes.pesoL.toFixed(3) }),
          ...(volumes.pesoB != null && { pesoB: volumes.pesoB.toFixed(3) }),
        },
      }),
    };
  }

  private buildCobr(dto: EmitNfeDto): Pick<Nfe55Options, 'cobr'> {
    const cobr = dto.cobr;
    if (!cobr?.fat && !cobr?.dup?.length) return {};

    return {
      cobr: {
        ...(cobr.fat && { fat: { ...cobr.fat } }),
        ...(cobr.dup?.length && {
          dup: cobr.dup.map((d) => ({ ...d })),
        }),
      },
    };
  }
}
