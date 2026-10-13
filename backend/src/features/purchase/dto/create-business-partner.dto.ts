// dto/create-business-partner.dto.ts
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerType } from 'generated/prisma/client';

export class CreateBusinessPartnerDto {
  @ApiProperty({ enum: PartnerType, example: 'SUPPLIER' })
  @IsEnum(PartnerType, {
    message: `Tipo deve ser um dos valores: ${Object.values(PartnerType).join(', ')}`,
  })
  type: PartnerType;

  @ApiProperty({ example: 'EDANTEX COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
  @IsString({ message: 'Nome deve ser texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiPropertyOptional({
    example: '16669045000274',
    description: 'CNPJ ou CPF, somente dígitos',
  })
  @IsString({ message: 'Documento deve ser texto' })
  @IsOptional()
  document?: string;

  @ApiPropertyOptional({ example: '1133853315' })
  @IsString({ message: 'Telefone deve ser texto' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@fornecedor.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'R JOAO SIMOES DE CARVALHO, 690 - SAO MIGUEL - CAMBUI/MG',
  })
  @IsString({ message: 'Endereço deve ser texto' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString({ message: 'Inscrição estadual deve ser texto' })
  @MaxLength(20, {
    message: 'Inscrição estadual deve ter no máximo 20 caracteres',
  })
  @IsOptional()
  stateRegistration?: string;

  @ApiPropertyOptional({ example: 'Belo Horizonte' })
  @IsString({ message: 'Cidade deve ser texto' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'MG', description: 'UF' })
  @IsString({ message: 'Estado deve ser texto' })
  @Length(2, 2, { message: 'Estado (UF) deve ter 2 caracteres' })
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'Código RNTC/ANTT (somente transportadora)',
  })
  @IsString({ message: 'RNTC deve ser texto' })
  @MaxLength(20, { message: 'RNTC deve ter no máximo 20 caracteres' })
  @IsOptional()
  rntc?: string;
}
