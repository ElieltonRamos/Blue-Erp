// src/company/dto/create-company.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Restaurante Blue PDV' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome da empresa') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome da empresa') })
  name: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsString({ message: ValidationMessages.IS_STRING('CNPJ') })
  @Length(14, 18, { message: 'CNPJ deve ter entre 14 e 18 caracteres' })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('CNPJ') })
  cnpj: string;

  @ApiProperty({ required: false, example: '(31) 3333-4444' })
  @IsString({ message: ValidationMessages.IS_STRING('Telefone') })
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, example: 'contato@bluepdv.com.br' })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL() })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: 'Rua das Flores, 123' })
  @IsString({ message: ValidationMessages.IS_STRING('Endereço') })
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false, example: 'Belo Horizonte' })
  @IsString({ message: ValidationMessages.IS_STRING('Cidade') })
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false, example: 'MG' })
  @IsString({ message: ValidationMessages.IS_STRING('Estado') })
  @Length(2, 2, { message: 'Estado deve ter 2 caracteres (UF)' })
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false, example: '30130-000' })
  @IsString({ message: ValidationMessages.IS_STRING('CEP') })
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ required: false, example: 'https://exemplo.com/logo.png' })
  @IsString({ message: ValidationMessages.IS_STRING('Logo') })
  @IsOptional()
  logo?: string;
}
