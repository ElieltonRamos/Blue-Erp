// business-partner.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma, PartnerType, BusinessPartner } from 'generated/prisma/client';
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { UpdateBusinessPartnerDto } from './dto/update-business-partner.dto';

@Injectable()
export class BusinessPartnerService {
  private readonly logger = new Logger(BusinessPartnerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusinessPartnerDto): Promise<BusinessPartner> {
    if (dto.document) {
      const existing = await this.prisma.client.businessPartner.findUnique({
        where: { document: this.cleanDocument(dto.document) },
      });
      if (existing) {
        throw new ConflictException('Já existe um parceiro com este documento');
      }
    }

    const partner = await this.prisma.client.businessPartner.create({
      data: {
        ...dto,
        document: dto.document ? this.cleanDocument(dto.document) : null,
      },
    });

    this.logger.log(
      `[Parceiro ${partner.id}] criado: ${partner.name} (${partner.type})`,
    );

    return partner;
  }

  async findAll(filters: { type?: PartnerType; active?: boolean } = {}) {
    const where: Prisma.BusinessPartnerWhereInput = {
      ...(filters.type && { type: filters.type }),
      ...(filters.active !== undefined && { active: filters.active }),
    };

    return this.prisma.client.businessPartner.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number): Promise<BusinessPartner> {
    const partner = await this.prisma.client.businessPartner.findUnique({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException(`Parceiro ${id} não encontrado`);
    }

    return partner;
  }

  async update(
    id: number,
    dto: UpdateBusinessPartnerDto,
  ): Promise<BusinessPartner> {
    await this.findOne(id);

    if (dto.document) {
      const existing = await this.prisma.client.businessPartner.findFirst({
        where: { document: this.cleanDocument(dto.document), id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Já existe um parceiro com este documento');
      }
    }

    const partner = await this.prisma.client.businessPartner.update({
      where: { id },
      data: {
        ...dto,
        document: dto.document ? this.cleanDocument(dto.document) : undefined,
      },
    });

    this.logger.log(`[Parceiro ${id}] atualizado`);

    return partner;
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.client.businessPartner.update({
      where: { id },
      data: { active: false },
    });

    this.logger.log(`[Parceiro ${id}] inativado`);

    return { message: 'Parceiro inativado com sucesso' };
  }

  /**
   * Usado pelo PurchaseService dentro da transação de importação de NFe.
   * Recebe o client de transação (tx) — mesmo padrão de stockService/productionService.
   *
   * Cria apenas o fornecedor (emitente da NFe, type SUPPLIER). Se o parceiro
   * já existe, ele é retornado sem ser atualizado.
   *
   * TODO: cadastrar a transportadora automaticamente na importação.
   *
   * Relação atual no schema:
   *  - BusinessPartner tem PartnerType.CARRIER e o campo `rntc` (código ANTT,
   *    só transportadora), mas Purchase só se liga a BusinessPartner por
   *    `supplierId` (fornecedor).
   *  - Purchase possui `stateRegistration`, `city`, `state` e `rntc` soltos,
   *    preenchidos hoje a partir de `transp.transporta` (IE, xMun, UF) e
   *    `transp.veicTransp.RNTC` do XML. Nome e CNPJ/CPF da transportadora
   *    não são guardados (só existem dentro de `fiscalXml`).
   *
   * Para fazer depois:
   *  1. NfeXmlParserService: extrair CNPJ/CPF e xNome de `transp.transporta`
   *     e incluir no ParsedNfeDto / CreatePurchaseFromXmlDto.
   *  2. Este método: receber o `type` por parâmetro (hoje fixo em SUPPLIER)
   *     e usar PartnerType.CARRIER para a transportadora.
   *  3. Schema: criar `carrierId` (opcional) em Purchase apontando para
   *     BusinessPartner, com relation nomeada (ex.: "PurchaseCarrier") para
   *     não colidir com `supplier`, e o lado inverso em BusinessPartner.
   *  4. Avaliar remover de Purchase os campos soltos (`stateRegistration`,
   *     `city`, `state`, `rntc`) se passarem a ser lidos da transportadora.
   */
  async findOrCreateByCnpj(
    tx: Prisma.TransactionClient,
    cnpj: string,
    name: string,
    extra: {
      stateRegistration?: string;
      city?: string;
      state?: string;
    } = {},
  ): Promise<BusinessPartner> {
    const cleanCnpj = this.cleanDocument(cnpj);

    const existing = await tx.businessPartner.findUnique({
      where: { document: cleanCnpj },
    });

    if (existing) {
      return existing;
    }

    const created = await tx.businessPartner.create({
      data: {
        type: PartnerType.SUPPLIER,
        name,
        document: cleanCnpj,
        stateRegistration: extra.stateRegistration ?? null,
        city: extra.city ?? null,
        state: extra.state ?? null,
      },
    });

    this.logger.log(
      `[Parceiro ${created.id}] criado automaticamente via NFe: ${name} (${cleanCnpj})`,
    );

    return created;
  }

  private cleanDocument(document: string): string {
    return document.replace(/\D/g, '');
  }
}
