// dto/create-business-partner.dto.ts
import {
  IsEnum,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerType } from 'generated/prisma/client';

export class CreateBusinessPartnerDto {
  @ApiProperty({ enum: PartnerType, example: 'SUPPLIER' })
  @IsEnum(PartnerType)
  type: PartnerType;

  @ApiProperty({ example: 'EDANTEX COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: '16669045000274',
    description: 'CNPJ ou CPF, somente dígitos',
  })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiPropertyOptional({ example: '1133853315' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@fornecedor.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'R JOAO SIMOES DE CARVALHO, 690 - SAO MIGUEL - CAMBUI/MG',
  })
  @IsString()
  @IsOptional()
  address?: string;
}
