import { IsEnum, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { OrderStatus, OrderType } from 'generated/prisma/client';

export class OrderFiltersDto {
  @ApiPropertyOptional({
    description: 'Buscar por nome do cliente',
    example: 'João',
  })
  @IsString()
  @IsOptional()
  searchName?: string;

  @ApiPropertyOptional({
    description: 'Buscar por número da mesa',
    example: 'Mesa 5',
  })
  @IsString()
  @IsOptional()
  searchTable?: string;

  @ApiPropertyOptional({
    description: 'Buscar por garçom que abriu',
    example: 'Carlos',
  })
  @IsString()
  @IsOptional()
  searchWaiterOpen?: string;

  @ApiPropertyOptional({
    description: 'Buscar por garçom que fechou',
    example: 'Ana',
  })
  @IsString()
  @IsOptional()
  searchWaiterClose?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    enum: OrderStatus,
    example: 'OPEN',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo',
    enum: OrderType,
    example: 'DINE_IN',
  })
  @IsEnum(OrderType)
  @IsOptional()
  type?: OrderType;

  @ApiPropertyOptional({
    description: 'Data de início (formato: YYYY-MM-DD)',
    example: '2025-02-06',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim (formato: YYYY-MM-DD)',
    example: '2025-02-06',
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class OrderPaginatedResponseDto {
  @ApiProperty({ description: 'Lista de pedidos', isArray: true })
  data: any[];

  @ApiProperty({ description: 'Total de registros', example: 50 })
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Itens por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
