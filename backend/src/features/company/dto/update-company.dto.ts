// src/company/dto/update-company.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { BusinessType } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { ValidationMessages } from 'src/common/utils/validation';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: '12345678000190' }) // SEM formatação
  @IsString({ message: ValidationMessages.IS_STRING('CNPJ') })
  @Length(14, 14, { message: 'CNPJ deve ter exatamente 14 dígitos' })
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter apenas 14 números' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CNPJ') })
  @IsOptional()
  cnpj?: string;

  @ApiPropertyOptional({
    enum: BusinessType,
    example: BusinessType.RESTAURANTE,
  })
  @IsEnum(BusinessType, { message: 'businessType inválido' })
  @IsOptional()
  businessType?: BusinessType;

  @ApiPropertyOptional({ example: { comandas: true, cozinha: true } })
  @IsOptional()
  enabledMenus?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ example: 'Blue Restaurante Ltda' })
  @IsString({ message: ValidationMessages.IS_STRING('Razão social') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Razão social') })
  @IsOptional()
  corporateName?: string;

  @ApiPropertyOptional({ example: 'Restaurante Blue PDV' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome fantasia') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome fantasia') })
  @IsOptional()
  tradeName?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString({ message: ValidationMessages.IS_STRING('Inscrição estadual') })
  @IsNotEmpty({
    message: ValidationMessages.IS_NOT_EMPTY('Inscrição estadual'),
  })
  @IsOptional()
  stateRegistration?: string;

  @ApiPropertyOptional({
    enum: ['1', '2', '3'],
    description:
      '1=Simples Nacional, 2=Simples Nacional - Excesso, 3=Regime Normal',
    example: '1',
  })
  @IsEnum(['1', '2', '3'], { message: 'Regime tributário deve ser 1, 2 ou 3' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Regime tributário') })
  @IsOptional()
  taxRegime?: '1' | '2' | '3';

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsString({ message: ValidationMessages.IS_STRING('Logradouro') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Logradouro') })
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsString({ message: ValidationMessages.IS_STRING('Número') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Número') })
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ example: 'Apt 101' })
  @IsString({ message: ValidationMessages.IS_STRING('Complemento') })
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsString({ message: ValidationMessages.IS_STRING('Bairro') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Bairro') })
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Belo Horizonte' })
  @IsString({ message: ValidationMessages.IS_STRING('Cidade') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Cidade') })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '3106705' })
  @IsString({ message: ValidationMessages.IS_STRING('Código IBGE') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Código IBGE') })
  @IsOptional()
  cityCode?: string;

  @ApiPropertyOptional({ example: 'MG' })
  @IsString({ message: ValidationMessages.IS_STRING('Estado') })
  @Length(2, 2, { message: 'Estado deve ter 2 caracteres (UF)' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Estado') })
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '30130-000' })
  @IsString({ message: ValidationMessages.IS_STRING('CEP') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CEP') })
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ example: '(31) 3333-4444' })
  @IsString({ message: ValidationMessages.IS_STRING('Telefone') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Telefone') })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@bluepdv.com.br' })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL() })
  @IsOptional()
  email?: string;

  // NFC-e
  @ApiPropertyOptional({ example: '001' })
  @IsString({ message: ValidationMessages.IS_STRING('Série NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Série NFC-e') })
  @IsOptional()
  nfceSeries?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber({}, { message: ValidationMessages.IS_NUMBER('Número atual NFC-e') })
  @Min(1, { message: 'Número atual NFC-e deve ser maior ou igual a 1' })
  @IsOptional()
  nfceCurrentNumber?: number;

  @ApiPropertyOptional({
    enum: ['production', 'staging'],
    example: 'production',
  })
  @IsEnum(['production', 'staging'], {
    message: 'Ambiente NFC-e deve ser production ou staging',
  })
  @IsOptional()
  nfceEnvironment?: 'production' | 'staging';

  @ApiPropertyOptional({ example: 'CSC_TOKEN_123456' })
  @IsString({ message: ValidationMessages.IS_STRING('CSC NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CSC NFC-e') })
  @IsOptional()
  nfceCsc?: string;

  @ApiPropertyOptional({ example: '000001' })
  @IsString({ message: ValidationMessages.IS_STRING('ID CSC NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('ID CSC NFC-e') })
  @IsOptional()
  nfceCscId?: string;

  // NF-e
  @ApiPropertyOptional({ example: '1' })
  @IsString({ message: ValidationMessages.IS_STRING('Série NF-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Série NF-e') })
  @IsOptional()
  nfeSeries?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber({}, { message: ValidationMessages.IS_NUMBER('Número atual NF-e') })
  @Min(0, { message: 'Número atual NF-e deve ser maior ou igual a 0' })
  @IsOptional()
  nfeCurrentNumber?: number;

  @ApiPropertyOptional({
    enum: ['production', 'staging'],
    example: 'staging',
  })
  @IsEnum(['production', 'staging'], {
    message: 'Ambiente NF-e deve ser production ou staging',
  })
  @IsOptional()
  nfeEnvironment?: 'production' | 'staging';

  @ApiPropertyOptional({
    example: 1.25,
    description: 'Alíquota de crédito do Simples Nacional (pCredSN), em %',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Alíquota de crédito do Simples deve ser um número com até 2 casas decimais',
    },
  )
  @Min(0, { message: 'Alíquota de crédito do Simples deve ser no mínimo 0' })
  @Max(100, {
    message: 'Alíquota de crédito do Simples deve ser no máximo 100',
  })
  @IsOptional()
  simplesCreditRate?: number;

  // Certificado (arquivo e senha vão pelo upload; aqui só a validade)
  @ApiPropertyOptional({ example: '2026-12-31T23:59:59' })
  @IsDateString(
    {},
    { message: 'Data de validade do certificado deve ser uma data ISO válida' },
  )
  @IsOptional()
  certificateExpirationDate?: string;
}
