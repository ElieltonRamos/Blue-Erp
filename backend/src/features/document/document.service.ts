import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { PaginatedResponseDto } from '../catalog-service/dto/paginated-response.dto.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { FindAllDocumentsDto } from './dto/find-all-documents.dto.js';
import { AddDocumentItemDto } from './dto/add-document-item.dto.js';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto.js';
import { DocumentStatus } from '../../../generated/prisma/enums.js';
import { UpdateDocumentItemDto } from './dto/update-document-item.dto.js';

const DOCUMENT_INCLUDE = {
  client: true,
  items: {
    include: {
      product: { select: { name: true } },
      service: { select: { name: true } },
    },
  },
} as const;

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateDocumentDto,
    username: string,
  ): Promise<DocumentResponseDto> {
    const client = await this.prisma.client.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new BadRequestException('Cliente não encontrado');
    }

    if (dto.assetId) {
      const asset = await this.prisma.client.asset.findUnique({
        where: { id: dto.assetId },
      });
      if (!asset) {
        throw new BadRequestException('Veículo não encontrado');
      }
      if (asset.clientId !== dto.clientId) {
        throw new BadRequestException('Veículo não pertence a este cliente');
      }
    }

    const document = await this.prisma.client.document.create({
      data: {
        type: dto.type,
        clientId: dto.clientId,
        assetId: dto.assetId,
        responsibleId: dto.responsibleId,
      },
      include: DOCUMENT_INCLUDE,
    });

    this.logger.log(
      `[Document ${document.id}] usuario=${username} | criado (type=${document.type}, clientId=${document.clientId})`,
    );

    return new DocumentResponseDto(document);
  }

  async updateItem(
    documentId: number,
    itemId: number,
    dto: UpdateDocumentItemDto,
    username: string,
  ): Promise<DocumentResponseDto> {
    await this.getEditableDocument(documentId);

    const item = await this.prisma.client.documentItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.documentId !== documentId) {
      throw new NotFoundException('Item não encontrado neste documento');
    }

    const quantity = dto.quantity ?? Number(item.quantity);
    const unitPrice = dto.unitPrice ?? Number(item.unitPrice);
    const total = quantity * unitPrice;

    const document = await this.prisma.client.$transaction(async (tx) => {
      await tx.documentItem.update({
        where: { id: itemId },
        data: { quantity, unitPrice, total },
      });

      const aggregate = await tx.documentItem.aggregate({
        where: { documentId },
        _sum: { total: true },
      });

      return tx.document.update({
        where: { id: documentId },
        data: { total: aggregate._sum.total ?? 0 },
        include: DOCUMENT_INCLUDE,
      });
    });

    this.logger.log(
      `[Document ${documentId}] usuario=${username} | item ${itemId} atualizado (quantity=${quantity}, unitPrice=${unitPrice})`,
    );

    return new DocumentResponseDto(document);
  }

  async findAll(
    query: FindAllDocumentsDto,
  ): Promise<PaginatedResponseDto<DocumentResponseDto>> {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      clientId,
      assetId,
      mechanicId,
      startDate,
      endDate,
      minTotal,
      maxTotal,
    } = query;

    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (assetId) where.assetId = assetId;

    if (mechanicId) {
      where.items = { some: { mechanicId } };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59`);
    }

    if (minTotal !== undefined || maxTotal !== undefined) {
      where.total = {};
      if (minTotal !== undefined) where.total.gte = minTotal;
      if (maxTotal !== undefined) where.total.lte = maxTotal;
    }

    const [documents, total] = await this.prisma.client.$transaction([
      this.prisma.client.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: DOCUMENT_INCLUDE,
      }),
      this.prisma.client.document.count({ where }),
    ]);

    return new PaginatedResponseDto(
      documents.map((d) => new DocumentResponseDto(d)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<DocumentResponseDto> {
    const document = await this.prisma.client.document.findUnique({
      where: { id },
      include: DOCUMENT_INCLUDE,
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    return new DocumentResponseDto(document);
  }

  private async getEditableDocument(id: number) {
    const document = await this.prisma.client.document.findUnique({
      where: { id },
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (
      document.status === DocumentStatus.COMPLETED ||
      document.status === DocumentStatus.CANCELED
    ) {
      throw new BadRequestException(
        'Documento finalizado ou cancelado não pode ser alterado',
      );
    }
    return document;
  }

  async addItem(
    documentId: number,
    dto: AddDocumentItemDto,
    username: string,
  ): Promise<DocumentResponseDto> {
    await this.getEditableDocument(documentId);

    if (dto.type === 'PRODUCT' && !dto.productId) {
      throw new BadRequestException(
        'productId é obrigatório para item do tipo PRODUCT',
      );
    }
    if (dto.type === 'SERVICE' && !dto.serviceId) {
      throw new BadRequestException(
        'serviceId é obrigatório para item do tipo SERVICE',
      );
    }

    const total = dto.quantity * dto.unitPrice;

    const document = await this.prisma.client.$transaction(async (tx) => {
      await tx.documentItem.create({
        data: {
          documentId,
          type: dto.type,
          productId: dto.productId,
          serviceId: dto.serviceId,
          mechanicId: dto.mechanicId,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          total,
        },
      });

      const aggregate = await tx.documentItem.aggregate({
        where: { documentId },
        _sum: { total: true },
      });

      return tx.document.update({
        where: { id: documentId },
        data: { total: aggregate._sum.total ?? 0 },
        include: DOCUMENT_INCLUDE,
      });
    });

    this.logger.log(
      `[Document ${documentId}] usuario=${username} | item adicionado (type=${dto.type}, total=${total})`,
    );

    return new DocumentResponseDto(document);
  }

  async removeItem(
    documentId: number,
    itemId: number,
    username: string,
  ): Promise<DocumentResponseDto> {
    await this.getEditableDocument(documentId);

    const item = await this.prisma.client.documentItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.documentId !== documentId) {
      throw new NotFoundException('Item não encontrado neste documento');
    }

    const document = await this.prisma.client.$transaction(async (tx) => {
      await tx.documentItem.delete({ where: { id: itemId } });

      const aggregate = await tx.documentItem.aggregate({
        where: { documentId },
        _sum: { total: true },
      });

      return tx.document.update({
        where: { id: documentId },
        data: { total: aggregate._sum.total ?? 0 },
        include: DOCUMENT_INCLUDE,
      });
    });

    this.logger.log(
      `[Document ${documentId}] usuario=${username} | item ${itemId} removido`,
    );

    return new DocumentResponseDto(document);
  }

  async approve(id: number, username: string): Promise<DocumentResponseDto> {
    const document = await this.prisma.client.document.findUnique({
      where: { id },
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (document.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException(
        'Apenas documento em DRAFT pode ser aprovado',
      );
    }

    const updated = await this.prisma.client.document.update({
      where: { id },
      data: { status: DocumentStatus.APPROVED, approvedAt: new Date() },
      include: DOCUMENT_INCLUDE,
    });

    this.logger.log(`[Document ${id}] usuario=${username} | aprovado`);

    return new DocumentResponseDto(updated);
  }

  async updateStatus(
    id: number,
    dto: UpdateDocumentStatusDto,
    username: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.client.document.findUnique({
      where: { id },
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    const allowedTransitions: Record<string, DocumentStatus[]> = {
      APPROVED: [DocumentStatus.IN_PROGRESS],
      IN_PROGRESS: [],
    };

    if (dto.status === DocumentStatus.COMPLETED) {
      throw new BadRequestException(
        'Use o endpoint de faturamento para concluir a OS',
      );
    }
    if (dto.status === DocumentStatus.CANCELED) {
      throw new BadRequestException('Use o endpoint de cancelamento');
    }

    const allowed = allowedTransitions[document.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transição de ${document.status} para ${dto.status} não permitida`,
      );
    }

    const updated = await this.prisma.client.document.update({
      where: { id },
      data: { status: dto.status },
      include: DOCUMENT_INCLUDE,
    });

    this.logger.log(
      `[Document ${id}] usuario=${username} | status ${document.status} -> ${dto.status}`,
    );

    return new DocumentResponseDto(updated);
  }

  async cancel(id: number, username: string): Promise<DocumentResponseDto> {
    const document = await this.prisma.client.document.findUnique({
      where: { id },
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    const existingSale = await this.prisma.client.sale.findUnique({
      where: { documentId: id },
    });
    if (existingSale) {
      throw new BadRequestException(
        'Documento já possui venda gerada e não pode ser cancelado',
      );
    }

    const updated = await this.prisma.client.document.update({
      where: { id },
      data: { status: DocumentStatus.CANCELED },
      include: DOCUMENT_INCLUDE,
    });

    this.logger.log(`[Document ${id}] usuario=${username} | cancelado`);

    return new DocumentResponseDto(updated);
  }
}
