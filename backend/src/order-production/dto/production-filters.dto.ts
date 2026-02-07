import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductionStatus } from 'generated/prisma/client';

export class ProductionFiltersDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status da produção',
    enum: ProductionStatus,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(ProductionStatus as object, {
    message: 'Status deve ser PENDING, IN_PROGRESS, COMPLETED ou CANCELED',
  })
  status?: ProductionStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por local de produção',
    example: 'LOCAL_01',
  })
  @IsOptional()
  @IsString({ message: 'Local de produção deve ser uma string' })
  productionLocation?: string;
}
