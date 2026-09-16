// find-all-purchase-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PurchaseStatus } from 'generated/prisma/client';

export class FindAllPurchaseQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior ou igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior ou igual a 1' })
  limit?: number = 10;

  @ApiPropertyOptional({ enum: PurchaseStatus })
  @IsOptional()
  @IsEnum(PurchaseStatus, {
    message: `Status inválido. Valores aceitos: ${Object.values(PurchaseStatus).join(', ')}`,
  })
  status?: PurchaseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Fornecedor deve ser um texto' })
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Campo de ordenação deve ser um texto' })
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Ordem deve ser "asc" ou "desc"',
  })
  sortOrder?: 'asc' | 'desc';
}
