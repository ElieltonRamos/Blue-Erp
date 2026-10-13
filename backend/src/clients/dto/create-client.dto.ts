// src/clients/dto/create-client.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export class CreateClientDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome') })
  name: string;

  @ApiProperty({ required: false, example: '(31) 99999-9999' })
  @IsString({ message: ValidationMessages.IS_STRING('Telefone') })
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, example: 'Rua das Flores, 123, Centro' })
  @IsString({ message: ValidationMessages.IS_STRING('Endereço') })
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false, example: '123.456.789-00' })
  @IsString({ message: ValidationMessages.IS_STRING('CPF') })
  @Length(11, 14, { message: 'CPF deve ter entre 11 e 14 caracteres' })
  @IsOptional()
  cpf?: string;

  @ApiProperty({ required: false, example: '12.345.678/0001-90' })
  @IsString({ message: ValidationMessages.IS_STRING('CNPJ') })
  @Length(14, 18, { message: 'CNPJ deve ter entre 14 e 18 caracteres' })
  @IsOptional()
  cnpj?: string;

  @ApiProperty({ required: false, example: '123456789' })
  @IsString({ message: ValidationMessages.IS_STRING('Inscrição estadual') })
  @MaxLength(20, {
    message: 'Inscrição estadual deve ter no máximo 20 caracteres',
  })
  @IsOptional()
  stateRegistration?: string;

  @ApiProperty({
    required: false,
    enum: ['1', '2', '9'],
    example: '9',
    description:
      'Indicador de IE do destinatário: 1 = contribuinte, 2 = isento, 9 = não contribuinte',
  })
  @IsIn(['1', '2', '9'], {
    message:
      'Indicador de IE deve ser 1 (contribuinte), 2 (isento) ou 9 (não contribuinte)',
  })
  @IsOptional()
  ieIndicator?: string;

  @ApiProperty({ required: false, example: 'Rua das Flores' })
  @IsString({ message: ValidationMessages.IS_STRING('Logradouro') })
  @IsOptional()
  street?: string;

  @ApiProperty({ required: false, example: '123' })
  @IsString({ message: ValidationMessages.IS_STRING('Número') })
  @IsOptional()
  number?: string;

  @ApiProperty({ required: false, example: 'Apto 101' })
  @IsString({ message: ValidationMessages.IS_STRING('Complemento') })
  @IsOptional()
  complement?: string;

  @ApiProperty({ required: false, example: 'Centro' })
  @IsString({ message: ValidationMessages.IS_STRING('Bairro') })
  @IsOptional()
  neighborhood?: string;

  @ApiProperty({ required: false, example: 'Belo Horizonte' })
  @IsString({ message: ValidationMessages.IS_STRING('Cidade') })
  @IsOptional()
  city?: string;

  @ApiProperty({
    required: false,
    example: '3106200',
    description: 'Código IBGE do município (7 dígitos)',
  })
  @IsString({ message: ValidationMessages.IS_STRING('Código do município') })
  @Matches(/^\d{7}$/, {
    message: 'Código do município (IBGE) deve ter 7 dígitos numéricos',
  })
  @IsOptional()
  cityCode?: string;

  @ApiProperty({ required: false, example: 'MG', description: 'UF' })
  @IsString({ message: ValidationMessages.IS_STRING('Estado') })
  @Length(2, 2, { message: 'Estado (UF) deve ter 2 caracteres' })
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false, example: '30110-000' })
  @IsString({ message: ValidationMessages.IS_STRING('CEP') })
  @Length(8, 9, { message: 'CEP deve ter entre 8 e 9 caracteres' })
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('Ativo') })
  @IsOptional()
  active?: boolean;
}
