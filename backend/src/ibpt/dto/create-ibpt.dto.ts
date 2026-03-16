import {
  IsString,
  IsNumber,
  Min,
  Max,
  Length,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIbptDto {
  @ApiProperty({
    description: 'Código NCM (8 dígitos)',
    example: '12345678',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8, { message: 'NCM deve ter exatamente 8 dígitos' })
  ncm: string;

  @ApiProperty({
    description: 'Alíquota federal (%)',
    example: 13.45,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Alíquota federal deve ser um número' })
  @Min(0, { message: 'Alíquota federal não pode ser negativa' })
  @Max(100, { message: 'Alíquota federal não pode ser maior que 100%' })
  federalTaxRate: number;

  @ApiProperty({
    description: 'Alíquota estadual (%)',
    example: 18.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Alíquota estadual deve ser um número' })
  @Min(0, { message: 'Alíquota estadual não pode ser negativa' })
  @Max(100, { message: 'Alíquota estadual não pode ser maior que 100%' })
  stateTaxRate: number;

  @ApiProperty({
    description: 'Alíquota municipal (%)',
    example: 5.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Alíquota municipal deve ser um número' })
  @Min(0, { message: 'Alíquota municipal não pode ser negativa' })
  @Max(100, { message: 'Alíquota municipal não pode ser maior que 100%' })
  municipalTaxRate: number;

  @ApiProperty({
    description: 'Versão da tabela IBPT',
    example: '24.1.A',
    required: false,
  })
  @IsOptional()
  @IsString()
  version: string;
}
