import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CloseCommissionDto } from './dto/close-commission.dto.js';
import { PayCommissionDto } from './dto/pay-commission.dto.js';
import { FindCommissionItemsDto } from './dto/find-commission-items.dto.js';
import { CommissionSummaryResponseDto } from './dto/commission-summary-response.dto.js';
import {
  DocumentItemType,
  DocumentStatus,
} from '../../../generated/prisma/client.js';

@Injectable()
export class DocumentCommissionService {
  private readonly logger = new Logger(DocumentCommissionService.name);

  constructor(private prisma: PrismaService) {}

  async closeCommission(
    dto: CloseCommissionDto,
    username: string,
  ): Promise<CommissionSummaryResponseDto> {
    const mechanic = await this.prisma.client.user.findUnique({
      where: { id: dto.mechanicId },
    });

    if (!mechanic) {
      throw new BadRequestException('Mecânico não encontrado');
    }

    if (
      mechanic.commissionRate === null ||
      mechanic.commissionRate === undefined
    ) {
      throw new BadRequestException(
        'Mecânico não possui percentual de comissão definido',
      );
    }

    const periodStart = new Date(`${dto.periodStart}T00:00:00`);
    const periodEnd = new Date(`${dto.periodEnd}T23:59:59`);

    const items = await this.prisma.client.documentItem.findMany({
      where: {
        type: DocumentItemType.SERVICE,
        mechanicId: dto.mechanicId,
        commissionClosedAt: null,
        document: {
          status: DocumentStatus.COMPLETED,
          finishedAt: { gte: periodStart, lte: periodEnd },
        },
      },
    });

    if (items.length === 0) {
      throw new BadRequestException(
        'Nenhum item de serviço encontrado para fechamento neste período',
      );
    }

    const rate = Number(mechanic.commissionRate);
    const now = new Date();

    await this.prisma.client.$transaction(
      items.map((item) =>
        this.prisma.client.documentItem.update({
          where: { id: item.id },
          data: {
            commissionRate: rate,
            commissionAmount: Number(item.total) * (rate / 100),
            commissionClosedAt: now,
          },
        }),
      ),
    );

    const totalLabor = items.reduce((sum, item) => sum + Number(item.total), 0);
    const totalCommission = totalLabor * (rate / 100);

    this.logger.log(
      `[Commission] usuario=${username} | fechamento mecanico=${dto.mechanicId} | itens=${items.length} | total=${totalCommission.toFixed(2)}`,
    );

    return new CommissionSummaryResponseDto({
      mechanicId: mechanic.id,
      mechanicName: mechanic.username,
      itemsCount: items.length,
      totalLabor,
      commissionRate: rate,
      totalCommission,
    });
  }

  async payCommission(
    dto: PayCommissionDto,
    username: string,
  ): Promise<CommissionSummaryResponseDto> {
    const mechanic = await this.prisma.client.user.findUnique({
      where: { id: dto.mechanicId },
    });

    if (!mechanic) {
      throw new BadRequestException('Mecânico não encontrado');
    }

    const where: any = {
      mechanicId: dto.mechanicId,
      commissionClosedAt: { not: null },
      commissionPaidAt: null,
    };

    if (dto.periodStart || dto.periodEnd) {
      where.commissionClosedAt = {
        ...where.commissionClosedAt,
        ...(dto.periodStart
          ? { gte: new Date(`${dto.periodStart}T00:00:00`) }
          : {}),
        ...(dto.periodEnd
          ? { lte: new Date(`${dto.periodEnd}T23:59:59`) }
          : {}),
      };
    }

    const items = await this.prisma.client.documentItem.findMany({ where });

    if (items.length === 0) {
      throw new BadRequestException(
        'Nenhuma comissão fechada pendente de pagamento encontrada',
      );
    }

    const now = new Date();

    await this.prisma.client.documentItem.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { commissionPaidAt: now },
    });

    const totalCommission = items.reduce(
      (sum, item) => sum + Number(item.commissionAmount ?? 0),
      0,
    );

    this.logger.log(
      `[Commission] usuario=${username} | pagamento mecanico=${dto.mechanicId} | itens=${items.length} | total=${totalCommission.toFixed(2)}`,
    );

    return new CommissionSummaryResponseDto({
      mechanicId: mechanic.id,
      mechanicName: mechanic.username,
      itemsCount: items.length,
      totalLabor: items.reduce((sum, item) => sum + Number(item.total), 0),
      totalCommission,
    });
  }

  async findItems(query: FindCommissionItemsDto) {
    const { mechanicId, status = 'open' } = query;

    const where: any = { type: DocumentItemType.SERVICE };
    if (mechanicId) where.mechanicId = mechanicId;

    if (status === 'open') {
      where.commissionClosedAt = null;
    } else if (status === 'closed') {
      where.commissionClosedAt = { not: null };
      where.commissionPaidAt = null;
    } else if (status === 'paid') {
      where.commissionPaidAt = { not: null };
    }

    return this.prisma.client.documentItem.findMany({
      where,
      include: {
        mechanic: { select: { id: true, username: true } },
        service: { select: { name: true } },
        document: { select: { id: true, finishedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
