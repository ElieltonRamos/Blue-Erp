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
} from 'class-validator';
import { Unit } from 'generated/prisma/client';

export class CreatePrimaryMaterialDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsString()
  @MinLength(1, { message: 'Código é obrigatório' })
  @MaxLength(50, { message: 'Código deve ter no máximo 50 caracteres' })
  code: string;

  @IsEnum(Unit, { message: 'Unidade de medida inválida' })
  unit: Unit;

  @IsNumber({}, { message: 'Custo unitário deve ser um número' })
  @Min(0, { message: 'Custo unitário não pode ser negativo' })
  unitCost: number;

  @IsOptional()
  @IsNumber({}, { message: 'Estoque atual deve ser um número' })
  @Min(0, { message: 'Estoque atual não pode ser negativo' })
  currentStock?: number;

  @IsOptional()
  @IsBoolean({ message: 'Active deve ser um valor booleano' })
  active?: boolean;

  @IsOptional()
  @IsString()
  @Length(8, 8, { message: 'NCM deve ter exatamente 8 dígitos' })
  ncm?: string;

  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'CFOP deve ter exatamente 4 dígitos' })
  cfop?: string;
}
