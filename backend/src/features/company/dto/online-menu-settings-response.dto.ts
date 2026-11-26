import { ApiProperty } from '@nestjs/swagger';
import { OnlinePaymentMethodDto } from './online-payment-method.dto.js';

type DecimalLike = { toNumber(): number };

export interface OnlineMenuSettingsSource {
  onlineMenuEnabled: boolean;
  onlineOrdersPaused: boolean;
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
  @ApiProperty() id: number;
  @ApiProperty({ description: '0 = domingo ... 6 = sábado' }) weekday: number;
  @ApiProperty({ example: '18:00' }) opensAt: string;
  @ApiProperty({ example: '23:00' }) closesAt: string;
}

export class OnlineMenuSettingsResponseDto {
  @ApiProperty() onlineMenuEnabled: boolean;
  @ApiProperty() onlineOrdersPaused: boolean;
  @ApiProperty() timezone: string;
  @ApiProperty({ nullable: true }) whatsapp: string | null;
  @ApiProperty({ nullable: true }) instagram: string | null;
  @ApiProperty({ nullable: true }) logoUrl: string | null;
  @ApiProperty({ nullable: true }) latitude: number | null;
  @ApiProperty({ nullable: true }) longitude: number | null;
  @ApiProperty({ nullable: true }) deliveryTimeMin: number | null;
  @ApiProperty({ nullable: true }) deliveryTimeMax: number | null;
  @ApiProperty({ nullable: true }) takeoutTime: number | null;
  @ApiProperty() deliveryFee: number;
  @ApiProperty() minOrderValue: number;
  @ApiProperty({ type: [OnlinePaymentMethodDto] })
  onlinePaymentMethods: OnlinePaymentMethodDto[];
  @ApiProperty({ type: [OpeningHourResponseDto] })
  openingHours: OpeningHourResponseDto[];

  constructor(company: OnlineMenuSettingsSource) {
    this.onlineMenuEnabled = company.onlineMenuEnabled;
    this.onlineOrdersPaused = company.onlineOrdersPaused;
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
