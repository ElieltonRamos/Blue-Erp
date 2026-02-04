import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateIbptDto } from './create-ibpt.dto';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class IbptResponseDto extends CreateIbptDto {
  id: number;
}

export class GetAllIbptQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'id',
    default: 'id',
    enum: [
      'id',
      'ncm',
      'aliqFederal',
      'aliqEstadual',
      'aliqMunicipal',
      'version',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'id',
    'ncm',
    'aliqFederal',
    'aliqEstadual',
    'aliqMunicipal',
    'version',
  ])
  sortKey?: string = 'id';

  @ApiPropertyOptional({
    description: 'Ordem de ordenação',
    example: 'asc',
    default: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'asc';
}

export class ImportCsvDto {
  @ApiProperty({
    description: 'Conteúdo do arquivo CSV com dados IBPT',
    example: 'codigo;ex;tipo;descricao;...\n12345678;0;0;Produto...',
  })
  @IsString()
  csv: string;
}

export class UpdateAliqSaleParamDto {
  @ApiProperty({
    description: 'ID da venda',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  saleId: number;
}
