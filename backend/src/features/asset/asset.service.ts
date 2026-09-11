import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AssetResponseDto } from './dto/asset-response.dto.js';
import { PaginatedResponseDto } from '../catalog-service/dto/paginated-response.dto.js';
import { FindAllAssetsDto } from './dto/find-all-assets.dto.js';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateAssetDto,
    username: string,
  ): Promise<AssetResponseDto> {
    const client = await this.prisma.client.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new BadRequestException('Cliente não encontrado');
    }

    const { attributes, ...assetData } = dto;

    const asset = await this.prisma.client.asset.create({
      data: {
        ...assetData,
        attributes: attributes?.length
          ? { create: attributes.map((a) => ({ key: a.key, value: a.value })) }
          : undefined,
      },
      include: { attributes: true, client: { select: { name: true } } },
    });

    this.logger.log(
      `[Asset ${asset.id}] usuario=${username} | criado "${asset.label}" (type=${asset.type})`,
    );

    return new AssetResponseDto(asset);
  }

  async findAll(
    query: FindAllAssetsDto,
  ): Promise<PaginatedResponseDto<AssetResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortKey = 'label',
      sortOrder = 'asc',
      search,
      type,
      clientId,
    } = query;

    const where: any = {};

    if (search) {
      where.label = { contains: search, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [assets, total] = await this.prisma.client.$transaction([
      this.prisma.client.asset.findMany({
        where,
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { attributes: true, client: { select: { name: true } } },
      }),
      this.prisma.client.asset.count({ where }),
    ]);

    return new PaginatedResponseDto(
      assets.map((a) => new AssetResponseDto(a)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<AssetResponseDto> {
    const asset = await this.prisma.client.asset.findUnique({
      where: { id },
      include: { attributes: true, client: { select: { name: true } } },
    });

    if (!asset) {
      throw new NotFoundException('Asset não encontrado');
    }

    return new AssetResponseDto(asset);
  }

  async update(
    id: number,
    dto: UpdateAssetDto,
    username: string,
  ): Promise<AssetResponseDto> {
    await this.findOne(id);

    if (dto.clientId !== undefined) {
      const client = await this.prisma.client.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new BadRequestException('Cliente não encontrado');
      }
    }

    const { attributes, ...assetData } = dto;

    const asset = await this.prisma.client.$transaction(async (tx) => {
      if (attributes !== undefined) {
        await tx.assetAttribute.deleteMany({ where: { assetId: id } });
      }

      return tx.asset.update({
        where: { id },
        data: {
          ...assetData,
          attributes:
            attributes !== undefined
              ? {
                  create: attributes.map((a) => ({
                    key: a.key,
                    value: a.value,
                  })),
                }
              : undefined,
        },
        include: { attributes: true, client: { select: { name: true } } },
      });
    });

    this.logger.log(
      `[Asset ${id}] usuario=${username} | atualizado: ${Object.keys(dto).join(', ')}`,
    );

    return new AssetResponseDto(asset);
  }
}
