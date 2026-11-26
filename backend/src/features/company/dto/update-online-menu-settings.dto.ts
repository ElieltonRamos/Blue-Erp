import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OnlinePaymentMethodDto } from './online-payment-method.dto.js';

const notUndefined = (_: unknown, value: unknown) => value !== undefined;

export class UpdateOnlineMenuSettingsDto {
  @ApiPropertyOptional({ example: true })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: 'O campo cardápio ativo deve ser verdadeiro ou falso' })
  onlineMenuEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @ValidateIf(notUndefined)
  @IsBoolean({
    message: 'O campo pedidos pausados deve ser verdadeiro ou falso',
  })
  onlineOrdersPaused?: boolean;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @ValidateIf(notUndefined)
  @IsString({ message: 'O fuso horário deve ser um texto' })
  @IsNotEmpty({ message: 'O fuso horário não pode ser vazio' })
  @MaxLength(191, {
    message: 'O fuso horário deve ter no máximo 191 caracteres',
  })
  timezone?: string;

  @ApiPropertyOptional({ example: '5533999999999', nullable: true })
  @IsOptional()
  @Matches(/^\d{10,13}$/, {
    message: 'O WhatsApp deve conter de 10 a 13 dígitos, apenas números',
  })
  whatsapp?: string | null;

  @ApiPropertyOptional({ example: 'minhaloja', nullable: true })
  @IsOptional()
  @IsString({ message: 'O Instagram deve ser um texto' })
  @MaxLength(100, { message: 'O Instagram deve ter no máximo 100 caracteres' })
  instagram?: string | null;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/logo.png',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'A URL do logo deve ser um texto' })
  @MaxLength(191, {
    message: 'A URL do logo deve ter no máximo 191 caracteres',
  })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: -17.0754, nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 7 },
    { message: 'A latitude deve ser um número com até 7 casas decimais' },
  )
  @Min(-90, { message: 'A latitude deve ser entre -90 e 90' })
  @Max(90, { message: 'A latitude deve ser entre -90 e 90' })
  latitude?: number | null;

  @ApiPropertyOptional({ example: -42.9515, nullable: true })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 7 },
    { message: 'A longitude deve ser um número com até 7 casas decimais' },
  )
  @Min(-180, { message: 'A longitude deve ser entre -180 e 180' })
  @Max(180, { message: 'A longitude deve ser entre -180 e 180' })
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'Minutos', example: 40, nullable: true })
  @IsOptional()
  @IsInt({ message: 'O tempo mínimo de entrega deve ser um número inteiro' })
  @Min(0, { message: 'O tempo mínimo de entrega não pode ser negativo' })
  deliveryTimeMin?: number | null;

  @ApiPropertyOptional({ description: 'Minutos', example: 60, nullable: true })
  @IsOptional()
  @IsInt({ message: 'O tempo máximo de entrega deve ser um número inteiro' })
  @Min(0, { message: 'O tempo máximo de entrega não pode ser negativo' })
  deliveryTimeMax?: number | null;

  @ApiPropertyOptional({ description: 'Minutos', example: 20, nullable: true })
  @IsOptional()
  @IsInt({ message: 'O tempo de retirada deve ser um número inteiro' })
  @Min(0, { message: 'O tempo de retirada não pode ser negativo' })
  takeoutTime?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @ValidateIf(notUndefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'A taxa de entrega deve ser um número com até 2 casas decimais',
    },
  )
  @Min(0, { message: 'A taxa de entrega não pode ser negativa' })
  deliveryFee?: number;

  @ApiPropertyOptional({ description: '0 = sem mínimo', example: 10 })
  @ValidateIf(notUndefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O pedido mínimo deve ser um número com até 2 casas decimais' },
  )
  @Min(0, { message: 'O pedido mínimo não pode ser negativo' })
  minOrderValue?: number;

  @ApiPropertyOptional({ type: [OnlinePaymentMethodDto] })
  @ValidateIf(notUndefined)
  @IsArray({ message: 'As formas de pagamento devem ser uma lista' })
  @ArrayMaxSize(3, { message: 'Informe no máximo 3 formas de pagamento' })
  @ArrayUnique((m: OnlinePaymentMethodDto) => m.type, {
    message: 'Não repita o tipo de pagamento',
  })
  @ValidateNested({ each: true })
  @Type(() => OnlinePaymentMethodDto)
  onlinePaymentMethods?: OnlinePaymentMethodDto[];
}
