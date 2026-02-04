import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { PaginatedResponse } from 'src/common/paginated-response.js';
import { Ibpt } from './entities/ibpt.js';

@Injectable()
export class IbptService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Métodos auxiliares privados =====

  private toNumber(value: unknown, casas: number): number {
    const n = typeof value === 'string' ? Number(value) : Number(value ?? 0);
    if (Number.isNaN(n)) return 0;
    const fator = Math.pow(10, casas);
    return Math.round(n * fator) / fator;
  }

  private validatePagination(page: number, limit: number): void {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException(
        'A página ou a quantidade de itens por página está incorreta',
      );
    }
  }

  private sanitizeSortParams(sortKey: string, sortOrder: string) {
    const validSortKeys = [
      'id',
      'ncm',
      'aliqFederal',
      'aliqEstadual',
      'aliqMunicipal',
      'version',
    ];
    const validSortOrders = ['asc', 'desc'];

    const safeSortKey = validSortKeys.includes(sortKey) ? sortKey : 'id';
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
      ? (sortOrder.toLowerCase() as 'asc' | 'desc')
      : 'asc';

    return { safeSortKey, safeSortOrder };
  }

  private buildPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  private cleanNcm(ncm: string): string {
    return ncm.replace(/\D/g, '').padStart(8, '0').slice(0, 8);
  }

  // ===== CRUD =====

  async getAll(
    page: number = 1,
    limit: number = 10,
    sortKey: string = 'id',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponse<Ibpt>> {
    this.validatePagination(page, limit);

    const { safeSortKey, safeSortOrder } = this.sanitizeSortParams(
      sortKey,
      sortOrder,
    );
    const offset = (page - 1) * limit;

    const ibpts = await this.prisma.client.ibpt.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        [safeSortKey]: safeSortOrder,
      },
    });

    const total = await this.prisma.client.ibpt.count();

    return this.buildPaginatedResponse<Ibpt>(ibpts, total, page, limit);
  }

  async getByNcm(ncm: string): Promise<Ibpt[]> {
    const cleanedNcm = this.cleanNcm(ncm);

    const registros = await this.prisma.client.ibpt.findMany({
      where: { ncm: cleanedNcm },
    });

    if (!registros || registros.length === 0) {
      throw new NotFoundException('Registro IBPT não encontrado');
    }

    return registros;
  }

  async create(data: Ibpt): Promise<Ibpt> {
    const cleanedNcm = this.cleanNcm(data.ncm);

    // Verifica se já existe registro com esse NCM
    const existente = await this.prisma.client.ibpt.findFirst({
      where: { ncm: cleanedNcm },
    });

    if (existente) {
      throw new ConflictException('NCM já cadastrado na tabela IBPT');
    }

    return this.prisma.client.ibpt.create({
      data: {
        ...data,
        ncm: cleanedNcm,
      },
    });
  }

  // async updateAliqSale(saleId: number): Promise<void> {
  //   // 1) Verifica se a venda existe
  //   const sale = await this.prisma.client.sale.findUnique({
  //     where: { id: saleId },
  //   });

  //   if (!sale) {
  //     throw new NotFoundException('Venda não encontrada');
  //   }

  //   // 2) Busca itens da venda em sales_products
  //   const itens = await this.prisma.client.salesProducts.findMany({
  //     where: { saleId },
  //   });

  //   if (!itens || itens.length === 0) {
  //     throw new NotFoundException('Venda sem itens');
  //   }

  //   // 3) Processa cada item
  //   for (const item of itens) {
  //     const ncm = this.cleanNcm(String(item.ncm || ''));

  //     const aliquotas = await this.prisma.client.ibpt.findFirst({
  //       where: { ncm },
  //     });

  //     if (!aliquotas) continue;

  //     const qCom = this.toNumber(item.qCom, 4);
  //     const vUnCom = this.toNumber(item.vUnCom, 4);
  //     const vProd = qCom * vUnCom;

  //     const aliqTotal =
  //       aliquotas.aliqFederal +
  //       aliquotas.aliqEstadual +
  //       aliquotas.aliqMunicipal;
  //     const vTotTrib = aliqTotal > 0 ? vProd * (aliqTotal / 100) : 0;

  //     await this.prisma.client.salesProducts.update({
  //       where: { id: item.id },
  //       data: {
  //         aliqFederal: aliquotas.aliqFederal,
  //         aliqEstadual: aliquotas.aliqEstadual,
  //         aliqMunicipal: aliquotas.aliqMunicipal,
  //         vTotTrib,
  //       },
  //     });
  //   }
  // }

  async importFromCsv(csv: string): Promise<void> {
    const linhas = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (linhas.length === 0) {
      throw new BadRequestException('Arquivo CSV vazio');
    }

    // Verifica se a primeira linha é cabeçalho (começa com "codigo;")
    const primeira = linhas[0].toLowerCase();
    const linhasDados = primeira.startsWith('codigo;')
      ? linhas.slice(1)
      : linhas;

    const registros: Ibpt[] = [];

    for (const linha of linhasDados) {
      const [
        codigo,
        _ex,
        _tipo,
        _descricao,
        nacionalFederal,
        _importadosFederal,
        estadual,
        municipal,
        _vigenciaInicio,
        _vigenciaFim,
        _chave,
        versao,
        _fonte,
      ] = linha.split(';');

      const ncm = this.cleanNcm(codigo || '');

      if (!ncm.trim()) continue;

      const aliqFederal =
        Number((nacionalFederal || '0').replace(',', '.')) || 0;
      const aliqEstadual = Number((estadual || '0').replace(',', '.')) || 0;
      const aliqMunicipal = Number((municipal || '0').replace(',', '.')) || 0;
      const version = (versao || '').trim();

      registros.push({
        ncm,
        aliqFederal,
        aliqEstadual,
        aliqMunicipal,
        version,
      });
    }

    if (registros.length === 0) {
      throw new BadRequestException(
        'Nenhum registro IBPT válido encontrado no CSV',
      );
    }

    // Atualiza toda a tabela em transação:
    // apaga tudo e insere a nova base
    await this.prisma.client.$transaction(async (tx) => {
      await tx.ibpt.deleteMany({});

      await tx.ibpt.createMany({
        data: registros,
      });
    });
  }
}
