import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ServiceResponseDto } from './dto/service-response.dto.js';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private prisma: PrismaService) {}

  private async getNextCode(): Promise<string> {
    const services = await this.prisma.client.service.findMany({
      select: { code: true },
    });

    const max = services.reduce((acc, s) => {
      const n = Number(s.code);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);

    return String(max + 1);
  }

  async create(
    dto: CreateServiceDto,
    username: string,
  ): Promise<ServiceResponseDto> {
    const start = Date.now();
    const code = await this.getNextCode();

    try {
      const service = await this.prisma.client.service.create({
        data: { ...dto, code },
      });

      this.logger.log(
        `[Serviço ${service.id}] usuario=${username} | criado "${service.name}" (code=${service.code}) em ${Date.now() - start}ms`,
      );

      return new ServiceResponseDto(service);
    } catch (error: unknown) {
      if ((error as any).code === 'P2002') {
        this.logger.warn(
          `[Serviço novo] usuario=${username} | code=${code} já existe (conflito de concorrência)`,
        );
        throw new ConflictException(
          'Código do serviço já existe, tente novamente',
        );
      }

      this.logger.error(
        `[Serviço novo] usuario=${username} | erro ao criar: ${(error as any).message}`,
      );
      throw error;
    }
  }

  async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.prisma.client.service.findMany({
      orderBy: { id: 'asc' },
    });

    return services.map((s) => new ServiceResponseDto(s));
  }

  async findOne(id: number): Promise<ServiceResponseDto> {
    const service = await this.prisma.client.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return new ServiceResponseDto(service);
  }

  async update(
    id: number,
    dto: UpdateServiceDto,
    username: string,
  ): Promise<ServiceResponseDto> {
    const start = Date.now();

    await this.findOne(id);

    try {
      const service = await this.prisma.client.service.update({
        where: { id },
        data: dto,
      });

      this.logger.log(
        `[Serviço ${id}] usuario=${username} | atualizado: ${Object.keys(dto).join(', ')} em ${Date.now() - start}ms`,
      );

      return new ServiceResponseDto(service);
    } catch (error: unknown) {
      this.logger.error(
        `[Serviço ${id}] usuario=${username} | erro ao atualizar: ${(error as any).message}`,
      );
      throw error;
    }
  }
}
