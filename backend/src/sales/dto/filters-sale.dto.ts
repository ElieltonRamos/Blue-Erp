import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { FiscalStatus } from 'generated/prisma/client';

export class SaleFiltersDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  operatorId?: number;

  @ApiPropertyOptional({ enum: FiscalStatus, example: FiscalStatus.PENDENTE })
  @IsEnum(FiscalStatus)
  @IsOptional()
  fiscalStatus?: FiscalStatus;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 'João Silva' })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional({ example: 'PIX' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: '35210512345678901234567890123456789012345678',
  })
  @IsString()
  @IsOptional()
  fiscalKey?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
