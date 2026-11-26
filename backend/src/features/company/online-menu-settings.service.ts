import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Company,
  OpeningHour,
  Prisma,
} from '../../../generated/prisma/client.js';
import { OnlineMenuSettingsResponseDto } from './dto/online-menu-settings-response.dto.js';
import {
  OpeningHourDto,
  ReplaceOpeningHoursDto,
} from './dto/opening-hour.dto.js';
import { UpdateOnlineMenuSettingsDto } from './dto/update-online-menu-settings.dto.js';
import { PrismaService } from '../../common/database/prisma.service.js';
import { COMPANY_ID } from './company.service.js';

const MINUTES_IN_DAY = 1440;
const MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY;

const SETTINGS_FIELDS = [
  'onlineMenuEnabled',
  'onlineOrdersPaused',
  'timezone',
  'whatsapp',
  'instagram',
  'logoUrl',
  'latitude',
  'longitude',
  'deliveryTimeMin',
  'deliveryTimeMax',
  'takeoutTime',
  'deliveryFee',
  'minOrderValue',
  'onlinePaymentMethods',
] as const;

type SettingsField = (typeof SETTINGS_FIELDS)[number];
type CompanyWithHours = Company & { openingHours: OpeningHour[] };

@Injectable()
export class OnlineMenuSettingsService {
  private readonly logger = new Logger(OnlineMenuSettingsService.name);

  private readonly include = {
    openingHours: { orderBy: [{ weekday: 'asc' }, { opensAt: 'asc' }] },
  } satisfies Prisma.CompanyInclude;

  constructor(private prisma: PrismaService) {}

  // Loga como error só o que não foi decisão do próprio service (falha de banco,
  // bug, etc). HttpException já foi logada como warn onde foi lançada.
  private rethrow(error: unknown, context: string): never {
    if (!(error instanceof HttpException)) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`${context}: ${reason}`);
    }
    throw error;
  }

  private badRequest(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new BadRequestException(message);
  }

  private async findCompany(actor: string): Promise<CompanyWithHours> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: COMPANY_ID },
      include: this.include,
    });
    if (!company) {
      this.logger.warn(`Empresa não cadastrada (actor=${actor})`);
      throw new NotFoundException('Empresa não cadastrada');
    }
    return company;
  }

  // Só os campos enviados que realmente mudaram em relação ao registro atual
  private diff(
    current: CompanyWithHours,
    dto: UpdateOnlineMenuSettingsDto,
  ): Prisma.CompanyUpdateInput {
    const currentValues: Record<SettingsField, unknown> = {
      onlineMenuEnabled: current.onlineMenuEnabled,
      onlineOrdersPaused: current.onlineOrdersPaused,
      timezone: current.timezone,
      whatsapp: current.whatsapp,
      instagram: current.instagram,
      logoUrl: current.logoUrl,
      latitude: current.latitude?.toNumber() ?? null,
      longitude: current.longitude?.toNumber() ?? null,
      deliveryTimeMin: current.deliveryTimeMin,
      deliveryTimeMax: current.deliveryTimeMax,
      takeoutTime: current.takeoutTime,
      deliveryFee: current.deliveryFee.toNumber(),
      minOrderValue: current.minOrderValue.toNumber(),
      onlinePaymentMethods: current.onlinePaymentMethods ?? [],
    };

    const changes: Record<string, unknown> = {};
    for (const key of SETTINGS_FIELDS) {
      const value =
        key === 'onlinePaymentMethods' && dto.onlinePaymentMethods
          ? dto.onlinePaymentMethods.map(({ type, label }) => ({ type, label }))
          : dto[key];

      if (
        value !== undefined &&
        JSON.stringify(value) !== JSON.stringify(currentValues[key])
      ) {
        changes[key] = value;
      }
    }
    return changes;
  }

  private validateTimezone(timezone: string, actor: string): void {
    try {
      new Intl.DateTimeFormat('pt-BR', { timeZone: timezone });
    } catch {
      this.badRequest('Fuso horário inválido', actor);
    }
  }

  private validateDeliveryTime(
    current: CompanyWithHours,
    dto: UpdateOnlineMenuSettingsDto,
    actor: string,
  ): void {
    const min =
      dto.deliveryTimeMin !== undefined
        ? dto.deliveryTimeMin
        : current.deliveryTimeMin;
    const max =
      dto.deliveryTimeMax !== undefined
        ? dto.deliveryTimeMax
        : current.deliveryTimeMax;

    if (min !== null && max !== null && min > max) {
      this.badRequest(
        'O tempo mínimo de entrega não pode ser maior que o máximo',
        actor,
      );
    }
  }

  private validateOpeningHours(hours: OpeningHourDto[], actor: string): void {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const ranges = hours.map((h) => {
      const open = toMinutes(h.opensAt);
      const close = toMinutes(h.closesAt);

      if (open === close) {
        this.badRequest(
          'O horário de abertura e o de fechamento não podem ser iguais',
          actor,
        );
      }

      return {
        start: h.weekday * MINUTES_IN_DAY + open,
        duration: (close - open + MINUTES_IN_DAY) % MINUTES_IN_DAY,
      };
    });

    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i];
        const b = ranges[j];
        const aToB = (b.start - a.start + MINUTES_IN_WEEK) % MINUTES_IN_WEEK;
        const bToA = (a.start - b.start + MINUTES_IN_WEEK) % MINUTES_IN_WEEK;

        if (aToB < a.duration || bToA < b.duration) {
          this.badRequest('Existem horários sobrepostos', actor);
        }
      }
    }
  }

  async getSettings(actor: string): Promise<OnlineMenuSettingsResponseDto> {
    const company = await this.findCompany(actor);
    return new OnlineMenuSettingsResponseDto(company);
  }

  async updateSettings(
    dto: UpdateOnlineMenuSettingsDto,
    actor: string,
  ): Promise<OnlineMenuSettingsResponseDto> {
    try {
      const company = await this.findCompany(actor);

      if (dto.timezone !== undefined) {
        this.validateTimezone(dto.timezone, actor);
      }
      this.validateDeliveryTime(company, dto, actor);

      const changes = this.diff(company, dto);
      const fields = Object.keys(changes);

      if (fields.length === 0) {
        this.logger.warn(
          `Edição das configurações do cardápio sem alterações (actor=${actor}, id=${company.id})`,
        );
        return new OnlineMenuSettingsResponseDto(company);
      }

      const updated = await this.prisma.client.company.update({
        where: { id: company.id },
        data: changes,
        include: this.include,
      });

      // Só nomes dos campos, nunca valores
      this.logger.log(
        `Configurações do cardápio editadas (actor=${actor}, id=${company.id}, campos=${fields.join(',')})`,
      );

      if (changes.onlineMenuEnabled !== undefined) {
        this.logger.warn(
          `Cardápio online ${updated.onlineMenuEnabled ? 'ativado' : 'desativado'} (actor=${actor}, id=${company.id})`,
        );
      }
      if (changes.onlineOrdersPaused !== undefined) {
        this.logger.warn(
          `Pedidos online ${updated.onlineOrdersPaused ? 'pausados' : 'retomados'} (actor=${actor}, id=${company.id})`,
        );
      }

      return new OnlineMenuSettingsResponseDto(updated);
    } catch (error) {
      this.rethrow(
        error,
        `Falha ao editar configurações do cardápio (actor=${actor})`,
      );
    }
  }

  async replaceOpeningHours(
    dto: ReplaceOpeningHoursDto,
    actor: string,
  ): Promise<OnlineMenuSettingsResponseDto> {
    try {
      const company = await this.findCompany(actor);
      this.validateOpeningHours(dto.hours, actor);

      await this.prisma.client.$transaction([
        this.prisma.client.openingHour.deleteMany({
          where: { companyId: company.id },
        }),
        this.prisma.client.openingHour.createMany({
          data: dto.hours.map((h) => ({
            companyId: company.id,
            weekday: h.weekday,
            opensAt: h.opensAt,
            closesAt: h.closesAt,
          })),
        }),
      ]);

      this.logger.log(
        `Horários de funcionamento substituídos (actor=${actor}, id=${company.id}, intervalos=${dto.hours.length})`,
      );

      return this.getSettings(actor);
    } catch (error) {
      this.rethrow(
        error,
        `Falha ao substituir horários de funcionamento (actor=${actor})`,
      );
    }
  }
}
