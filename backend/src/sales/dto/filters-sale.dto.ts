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
  @ApiPropertyOptional({
    description: 'Página atual',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID do cliente', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do operador',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  operatorId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por método de pagamento',
    example: 'DINHEIRO',
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status fiscal',
    enum: FiscalStatus,
    example: FiscalStatus.PENDENTE,
  })
  @IsEnum(FiscalStatus)
  @IsOptional()
  fiscalStatus?: FiscalStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por vendas pagas/não pagas',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === true) return true;
    if (value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por nome do cliente',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por chave fiscal',
    example: '35210512345678901234567890123456789012345678',
  })
  @IsString()
  @IsOptional()
  fiscalKey?: string;

  @ApiPropertyOptional({
    description: 'Data inicial (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsString()
  @IsOptional()
  endDate?: string;
}
