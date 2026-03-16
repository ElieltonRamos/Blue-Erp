import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Length,
  MinLength,
  MaxLength,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Unit } from 'generated/prisma/client';
import { Type } from 'class-transformer';

// CreatePrimaryMaterialDto
export class CreatePrimaryMaterialDto {
  @ApiProperty({
    description: 'Nome da matéria-prima',
    minLength: 3,
    maxLength: 100,
    example: 'Farinha de Trigo',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Código único da matéria-prima',
    minLength: 1,
    maxLength: 50,
    example: 'MP-001',
  })
  @IsString()
  @MinLength(1, { message: 'Código é obrigatório' })
  @MaxLength(50, { message: 'Código deve ter no máximo 50 caracteres' })
  code: string;

  @ApiProperty({
    description: 'Unidade de medida',
    enum: Unit,
    example: 'KG',
  })
  @IsEnum(Unit, { message: 'Unidade de medida inválida' })
  unit: Unit;

  @ApiProperty({
    description: 'Custo unitário',
    minimum: 0,
    example: 5.5,
  })
  @IsNumber({}, { message: 'Custo unitário deve ser um número' })
  @Min(0, { message: 'Custo unitário não pode ser negativo' })
  unitCost: number;

  @ApiPropertyOptional({
    description: 'Estoque atual',
    minimum: 0,
    example: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque atual deve ser um número' })
  @Min(0, { message: 'Estoque atual não pode ser negativo' })
  currentStock?: number;

  @ApiPropertyOptional({
    description: 'Estoque mínimo',
    minimum: 0,
    example: 20,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque mínimo deve ser um número' })
  @Min(0, { message: 'Estoque mínimo não pode ser negativo' })
  minStock?: number;

  @ApiPropertyOptional({
    description: 'Data de validade',
    example: '2025-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Data de validade inválida' })
  expiryDate?: Date;

  @ApiPropertyOptional({
    description: 'Status ativo/inativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active deve ser um valor booleano' })
  active?: boolean;

  @ApiPropertyOptional({
    description: 'NCM (Nomenclatura Comum do Mercosul)',
    minLength: 8,
    maxLength: 8,
    example: '11010010',
  })
  @IsOptional()
  @IsString()
  @Length(8, 8, { message: 'NCM deve ter exatamente 8 dígitos' })
  ncm?: string;

  @ApiPropertyOptional({
    description: 'CFOP (Código Fiscal de Operações e Prestações)',
    minLength: 4,
    maxLength: 4,
    example: '5102',
  })
  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'CFOP deve ter exatamente 4 dígitos' })
  cfop?: string;
}
