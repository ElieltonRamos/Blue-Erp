import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ValidationMessages, digitsOrNull, notUndefined, trim, trimOrNull } from '../../../common/utils/validation';
import { OnlinePaymentMethodDto } from './online-payment-method.dto.js';

export class UpdateOnlineMenuSettingsDto {
  @ApiPropertyOptional({ example: true })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O campo cardápio ativo') })
  onlineMenuEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O campo pedidos pausados') })
  onlineOrdersPaused?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Quando ligado, o cardápio online considera o estoque na disponibilidade. Desligado, sempre mostra.',
  })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O controle de estoque do cardápio online') })
  onlineMenuControlStock?: boolean;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O fuso horário') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O fuso horário') })
  @MaxLength(191, { message: ValidationMessages.MAX_LENGTH('O fuso horário', 191) })
  timezone?: string;

  @ApiPropertyOptional({ description: 'Apenas dígitos, com DDD (10 a 13 dígitos)', example: '5533999999999', nullable: true })
  @IsOptional()
  @Transform(digitsOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O WhatsApp') })
  @MinLength(10, { message: ValidationMessages.MIN_LENGTH('O WhatsApp', 10) })
  @MaxLength(13, { message: ValidationMessages.MAX_LENGTH('O WhatsApp', 13) })
  whatsapp?: string | null;

  @ApiPropertyOptional({ example: 'minhaloja', nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O Instagram') })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH('O Instagram', 100) })
  instagram?: string | null;

  @ApiPropertyOptional({ example: 'https://exemplo.com/logo.png', nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('A URL do logo') })
  @MaxLength(191, { message: ValidationMessages.MAX_LENGTH('A URL do logo', 191) })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: -17.0754, minimum: -90, maximum: 90, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 }, { message: ValidationMessages.IS_DECIMAL('A latitude', 7) })
  @Min(-90, { message: ValidationMessages.MIN('A latitude', -90) })
  @Max(90, { message: ValidationMessages.MAX('A latitude', 90) })
  latitude?: number | null;

  @ApiPropertyOptional({ example: -42.9515, minimum: -180, maximum: 180, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 }, { message: ValidationMessages.IS_DECIMAL('A longitude', 7) })
  @Min(-180, { message: ValidationMessages.MIN('A longitude', -180) })
  @Max(180, { message: ValidationMessages.MAX('A longitude', 180) })
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'Minutos', example: 40, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O tempo mínimo de entrega') })
  @Min(0, { message: ValidationMessages.MIN('O tempo mínimo de entrega', 0) })
  deliveryTimeMin?: number | null;

  @ApiPropertyOptional({ description: 'Minutos', example: 60, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O tempo máximo de entrega') })
  @Min(0, { message: ValidationMessages.MIN('O tempo máximo de entrega', 0) })
  deliveryTimeMax?: number | null;

  @ApiPropertyOptional({ description: 'Minutos', example: 20, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O tempo de retirada') })
  @Min(0, { message: ValidationMessages.MIN('O tempo de retirada', 0) })
  takeoutTime?: number | null;

  @ApiPropertyOptional({ example: 5, minimum: 0 })
  @ValidateIf(notUndefined)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A taxa de entrega', 2) })
  @Min(0, { message: ValidationMessages.MIN('A taxa de entrega', 0) })
  deliveryFee?: number;

  @ApiPropertyOptional({ description: '0 = sem mínimo', example: 10, minimum: 0 })
  @ValidateIf(notUndefined)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O pedido mínimo', 2) })
  @Min(0, { message: ValidationMessages.MIN('O pedido mínimo', 0) })
  minOrderValue?: number;

  @ApiPropertyOptional({ type: [OnlinePaymentMethodDto] })
  @ValidateIf(notUndefined)
  @IsArray({ message: ValidationMessages.IS_ARRAY('O campo formas de pagamento') })
  @ArrayMaxSize(3, { message: ValidationMessages.ARRAY_MAX_SIZE('O campo formas de pagamento', 3) })
  @ArrayUnique((m: OnlinePaymentMethodDto) => m.type, { message: ValidationMessages.ARRAY_UNIQUE('O campo formas de pagamento') })
  @ValidateNested({ each: true })
  @Type(() => OnlinePaymentMethodDto)
  onlinePaymentMethods?: OnlinePaymentMethodDto[];
}
