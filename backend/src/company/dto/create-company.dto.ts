// src/company/dto/create-company.dto.ts
import { ApiProperty } from '@nestjs/swagger';
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
  Matches,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export class CreateCompanyDto {
  @ApiProperty({ example: '12345678000190' }) // SEM formatação
  @IsString({ message: ValidationMessages.IS_STRING('CNPJ') })
  @Length(14, 14, { message: 'CNPJ deve ter exatamente 14 dígitos' })
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter apenas 14 números' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CNPJ') })
  cnpj: string;

  @ApiProperty({ example: 'Blue Restaurante Ltda' })
  @IsString({ message: ValidationMessages.IS_STRING('Razão social') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Razão social') })
  corporateName: string;

  @ApiProperty({ example: 'Restaurante Blue PDV' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome fantasia') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome fantasia') })
  tradeName: string;

  @ApiProperty({ example: '123456789' })
  @IsString({ message: ValidationMessages.IS_STRING('Inscrição estadual') })
  @IsNotEmpty({
    message: ValidationMessages.IS_NOT_EMPTY('Inscrição estadual'),
  })
  stateRegistration: string;

  @ApiProperty({
    enum: ['1', '2', '3'],
    description:
      '1=Simples Nacional, 2=Simples Nacional - Excesso, 3=Regime Normal',
    example: '1',
  })
  @IsEnum(['1', '2', '3'], { message: 'Regime tributário deve ser 1, 2 ou 3' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Regime tributário') })
  taxRegime: '1' | '2' | '3';

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString({ message: ValidationMessages.IS_STRING('Logradouro') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Logradouro') })
  street: string;

  @ApiProperty({ example: '123' })
  @IsString({ message: ValidationMessages.IS_STRING('Número') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Número') })
  number: string;

  @ApiProperty({ required: false, example: 'Apt 101' })
  @IsString({ message: ValidationMessages.IS_STRING('Complemento') })
  @IsOptional()
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString({ message: ValidationMessages.IS_STRING('Bairro') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Bairro') })
  neighborhood: string;

  @ApiProperty({ example: 'Belo Horizonte' })
  @IsString({ message: ValidationMessages.IS_STRING('Cidade') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Cidade') })
  city: string;

  @ApiProperty({ example: '3106705' })
  @IsString({ message: ValidationMessages.IS_STRING('Código IBGE') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Código IBGE') })
  cityCode: string;

  @ApiProperty({ example: 'MG' })
  @IsString({ message: ValidationMessages.IS_STRING('Estado') })
  @Length(2, 2, { message: 'Estado deve ter 2 caracteres (UF)' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Estado') })
  state: string;

  @ApiProperty({ example: '30130-000' })
  @IsString({ message: ValidationMessages.IS_STRING('CEP') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CEP') })
  zipCode: string;

  @ApiProperty({ example: '(31) 3333-4444' })
  @IsString({ message: ValidationMessages.IS_STRING('Telefone') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Telefone') })
  phone: string;

  @ApiProperty({ required: false, example: 'contato@bluepdv.com.br' })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL() })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '001' })
  @IsString({ message: ValidationMessages.IS_STRING('Série NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Série NFC-e') })
  nfceSeries: string;

  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: ValidationMessages.IS_NUMBER('Número atual NFC-e') })
  @Min(1)
  @IsNotEmpty({
    message: ValidationMessages.IS_NOT_EMPTY('Número atual NFC-e'),
  })
  nfceCurrentNumber: number;

  @ApiProperty({ enum: ['production', 'staging'], example: 'production' })
  @IsEnum(['production', 'staging'], {
    message: 'Ambiente deve ser production ou staging',
  })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Ambiente NFC-e') })
  nfceEnvironment: 'production' | 'staging';

  @ApiProperty({ example: 'CSC_TOKEN_123456' })
  @IsString({ message: ValidationMessages.IS_STRING('CSC NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CSC NFC-e') })
  nfceCsc: string;

  @ApiProperty({ example: '000001' })
  @IsString({ message: ValidationMessages.IS_STRING('ID CSC NFC-e') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('ID CSC NFC-e') })
  nfceCscId: string;

  @ApiProperty({ example: '/certs/certificado.pfx' })
  @IsString({ message: ValidationMessages.IS_STRING('Caminho certificado') })
  @IsNotEmpty({
    message: ValidationMessages.IS_NOT_EMPTY('Caminho certificado'),
  })
  certificatePath: string;

  @ApiProperty({ example: 'senha123' })
  @IsString({ message: ValidationMessages.IS_STRING('Senha certificado') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Senha certificado') })
  certificatePassword: string;

  @ApiProperty({ required: false, example: '2026-12-31T23:59:59' })
  @IsDateString()
  @IsOptional()
  certificateExpirationDate?: string;

  @ApiProperty({ example: '4.0' })
  @IsString({ message: ValidationMessages.IS_STRING('Versão IBPT') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Versão IBPT') })
  ibptVersion: string;

  @ApiProperty({ example: 'ABC123-XYZ789' })
  @IsString({ message: ValidationMessages.IS_STRING('Chave de licença') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Chave de licença') })
  licenseKey: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString({ message: ValidationMessages.IS_STRING('Token de licença') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Token de licença') })
  licenseToken: string;
}
