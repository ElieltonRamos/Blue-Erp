import { ApiProperty } from '@nestjs/swagger';
import { OnlinePaymentMethodDto } from './online-payment-method.dto.js';

type DecimalLike = { toNumber(): number };

export interface OnlineMenuSettingsSource {
  onlineMenuEnabled: boolean;
  onlineOrdersPaused: boolean;
  onlineMenuControlStock: boolean;
  timezone: string;
  whatsapp: string | null;
  instagram: string | null;
  logoUrl: string | null;
  latitude: DecimalLike | null;
  longitude: DecimalLike | null;
  deliveryTimeMin: number | null;
  deliveryTimeMax: number | null;
  takeoutTime: number | null;
  deliveryFee: DecimalLike;
  minOrderValue: DecimalLike;
  onlinePaymentMethods: unknown;
  openingHours: {
    id: number;
    weekday: number;
    opensAt: string;
    closesAt: string;
  }[];
}

export class OpeningHourResponseDto {
  @ApiProperty({ description: 'Identificador do intervalo', example: 1 })
  id: number;

  @ApiProperty({
    description: '0 = domingo ... 6 = sábado',
    minimum: 0,
    maximum: 6,
    example: 1,
  })
  weekday: number;

  @ApiProperty({ description: 'Abertura (HH:mm)', example: '18:00' })
  opensAt: string;

  @ApiProperty({
    description:
      'Fechamento (HH:mm). Menor que a abertura = termina no dia seguinte',
    example: '23:00',
  })
  closesAt: string;
}

export class OnlineMenuSettingsResponseDto {
  @ApiProperty({ description: 'Cardápio online ativo', example: true })
  onlineMenuEnabled: boolean;

  @ApiProperty({
    description: 'Recebimento de pedidos pausado',
    example: false,
  })
  onlineOrdersPaused: boolean;

  @ApiProperty({
    example: true,
    description: 'Se o cardápio online considera o estoque na disponibilidade',
  })
  onlineMenuControlStock: boolean;

  @ApiProperty({
    description: 'Fuso horário da loja',
    example: 'America/Sao_Paulo',
  })
  timezone: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Somente dígitos, com DDD',
    example: '5533999999999',
  })
  whatsapp: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'minhaloja' })
  instagram: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'URL do logo',
    example: 'https://exemplo.com/logo.png',
  })
  logoUrl: string | null;

  @ApiProperty({ type: Number, nullable: true, example: -17.0754 })
  latitude: number | null;

  @ApiProperty({ type: Number, nullable: true, example: -42.9515 })
  longitude: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Tempo mínimo de entrega, em minutos',
    example: 40,
  })
  deliveryTimeMin: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Tempo máximo de entrega, em minutos',
    example: 60,
  })
  deliveryTimeMax: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Tempo de retirada, em minutos',
    example: 20,
  })
  takeoutTime: number | null;

  @ApiProperty({ description: 'Taxa de entrega fixa', example: 5 })
  deliveryFee: number;

  @ApiProperty({ description: 'Pedido mínimo (0 = sem mínimo)', example: 10 })
  minOrderValue: number;

  @ApiProperty({
    type: [OnlinePaymentMethodDto],
    description: 'Formas de pagamento aceitas no cardápio online',
  })
  onlinePaymentMethods: OnlinePaymentMethodDto[];

  @ApiProperty({
    type: [OpeningHourResponseDto],
    description: 'Horários de funcionamento; dia sem intervalo = fechado',
  })
  openingHours: OpeningHourResponseDto[];

  constructor(company: OnlineMenuSettingsSource) {
    this.onlineMenuEnabled = company.onlineMenuEnabled;
    this.onlineOrdersPaused = company.onlineOrdersPaused;
    this.onlineMenuControlStock = company.onlineMenuControlStock;
    this.timezone = company.timezone;
    this.whatsapp = company.whatsapp;
    this.instagram = company.instagram;
    this.logoUrl = company.logoUrl;
    this.latitude = company.latitude?.toNumber() ?? null;
    this.longitude = company.longitude?.toNumber() ?? null;
    this.deliveryTimeMin = company.deliveryTimeMin;
    this.deliveryTimeMax = company.deliveryTimeMax;
    this.takeoutTime = company.takeoutTime;
    this.deliveryFee = company.deliveryFee.toNumber();
    this.minOrderValue = company.minOrderValue.toNumber();
    this.onlinePaymentMethods =
      (company.onlinePaymentMethods as OnlinePaymentMethodDto[] | null) ?? [];
    this.openingHours = company.openingHours.map((h) => ({
      id: h.id,
      weekday: h.weekday,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    }));
  }
}
