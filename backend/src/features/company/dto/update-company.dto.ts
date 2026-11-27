// src/features/company/dto/update-company.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { BusinessType } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { ValidationMessages, digits, notUndefined, trim, trimOrNull } from 'src/common/utils/validation';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: '12345678000190', description: 'Somente dígitos' })
  @ValidateIf(notUndefined)
  @Transform(digits)
  @IsString({ message: ValidationMessages.IS_STRING('O CNPJ') })
  @Length(14, 14, { message: ValidationMessages.EXACT_DIGITS('O CNPJ', 14) })
  cnpj?: string;

  @ApiPropertyOptional({ enum: BusinessType, example: BusinessType.RESTAURANTE })
  @ValidateIf(notUndefined)
  @IsEnum(BusinessType, { message: ValidationMessages.IS_ENUM('O tipo de negócio') })
  businessType?: BusinessType;

  @ApiPropertyOptional({ example: { comandas: true, cozinha: true } })
  @ValidateIf(notUndefined)
  @IsObject({ message: ValidationMessages.IS_OBJECT('Os menus habilitados') })
  enabledMenus?: Prisma.InputJsonObject;

  @ApiPropertyOptional({ example: 'Blue Restaurante Ltda' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A razão social') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('A razão social') })
  corporateName?: string;

  @ApiPropertyOptional({ example: 'Restaurante Blue PDV' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O nome fantasia') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O nome fantasia') })
  tradeName?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A inscrição estadual') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('A inscrição estadual') })
  stateRegistration?: string;

  @ApiPropertyOptional({
    enum: ['1', '2', '3'],
    description: '1=Simples Nacional, 2=Simples Nacional - Excesso, 3=Regime Normal',
    example: '1',
  })
  @ValidateIf(notUndefined)
  @IsEnum(['1', '2', '3'], { message: ValidationMessages.IS_ENUM('O regime tributário') })
  taxRegime?: '1' | '2' | '3';

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O logradouro') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O logradouro') })
  street?: string;

  @ApiPropertyOptional({ example: '123' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O número') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O número') })
  number?: string;

  @ApiPropertyOptional({ example: 'Apt 101', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O complemento') })
  complement?: string | null;

  @ApiPropertyOptional({ example: 'Centro' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O bairro') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O bairro') })
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Belo Horizonte' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A cidade') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('A cidade') })
  city?: string;

  @ApiPropertyOptional({ example: '3106705', description: 'Código IBGE do município' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O código IBGE') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O código IBGE') })
  cityCode?: string;

  @ApiPropertyOptional({ example: 'MG', description: 'UF' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O estado') })
  @Length(2, 2, { message: ValidationMessages.EXACT_LENGTH('O estado', 2) })
  state?: string;

  @ApiPropertyOptional({ example: '30130-000' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O CEP') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O CEP') })
  zipCode?: string;

  @ApiPropertyOptional({ example: '(31) 3333-4444' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O telefone') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O telefone') })
  phone?: string;

  @ApiPropertyOptional({ example: 'contato@bluepdv.com.br', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL() })
  email?: string | null;

  // NFC-e
  @ApiPropertyOptional({ example: '001' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A série da NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('A série da NFC-e') })
  nfceSeries?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('O número atual da NFC-e') })
  @Min(1, { message: ValidationMessages.MIN('O número atual da NFC-e', 1) })
  nfceCurrentNumber?: number;

  @ApiPropertyOptional({ enum: ['production', 'staging'], example: 'production' })
  @ValidateIf(notUndefined)
  @IsEnum(['production', 'staging'], { message: ValidationMessages.IS_ENUM('O ambiente da NFC-e') })
  nfceEnvironment?: 'production' | 'staging';

  @ApiPropertyOptional({ example: 'CSC_TOKEN_123456' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O CSC da NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O CSC da NFC-e') })
  nfceCsc?: string;

  @ApiPropertyOptional({ example: '000001' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O ID do CSC da NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O ID do CSC da NFC-e') })
  nfceCscId?: string;

  // NF-e
  @ApiPropertyOptional({ example: '1' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A série da NF-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('A série da NF-e') })
  nfeSeries?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('O número atual da NF-e') })
  @Min(0, { message: ValidationMessages.MIN('O número atual da NF-e', 0) })
  nfeCurrentNumber?: number;

  @ApiPropertyOptional({ enum: ['production', 'staging'], example: 'staging' })
  @ValidateIf(notUndefined)
  @IsEnum(['production', 'staging'], { message: ValidationMessages.IS_ENUM('O ambiente da NF-e') })
  nfeEnvironment?: 'production' | 'staging';

  @ApiPropertyOptional({
    example: 1.25,
    minimum: 0,
    maximum: 100,
    nullable: true,
    description: 'Alíquota de crédito do Simples Nacional (pCredSN), em %',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota de crédito do Simples', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota de crédito do Simples', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota de crédito do Simples', 100) })
  simplesCreditRate?: number | null;

  // Certificado (arquivo e senha vão pelo upload; aqui só a validade)
  @ApiPropertyOptional({ example: '2026-12-31T23:59:59', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsDateString({}, { message: ValidationMessages.IS_DATE('A data de validade do certificado') })
  certificateExpirationDate?: string | null;
}
