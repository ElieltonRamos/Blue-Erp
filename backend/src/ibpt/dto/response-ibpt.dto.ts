import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetAllIbptQueryDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiProperty({
    description: 'Campo para ordenação',
    example: 'ncm',
    required: false,
    default: 'id',
    enum: [
      'id',
      'ncm',
      'federalTaxRate',
      'stateTaxRate',
      'municipalTaxRate',
      'version',
    ],
  })
  @IsOptional()
  @IsString()
  sortKey: string = 'id';

  @ApiProperty({
    description: 'Ordem da ordenação',
    example: 'asc',
    required: false,
    default: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder: string = 'asc';
}

export class IbptResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '12345678' })
  ncm: string;

  @ApiProperty({ example: 13.45 })
  federalTaxRate: number;

  @ApiProperty({ example: 18.0 })
  stateTaxRate: number;

  @ApiProperty({ example: 5.0 })
  municipalTaxRate: number;

  @ApiProperty({ example: '24.1.A' })
  version: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class IbptListResponseDto {
  @ApiProperty({ type: [IbptResponseDto] })
  data: IbptResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
