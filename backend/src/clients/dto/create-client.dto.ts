// src/clients/dto/create-client.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

// backend ficara pausado ate o frontend estiver pronto
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

  @ApiProperty({ required: false, default: true })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('Ativo') })
  @IsOptional()
  active?: boolean;
}
