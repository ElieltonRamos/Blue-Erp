// src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  CASHIER = 'CASHIER',
  KITCHEN = 'KITCHEN',
  USER = 'USER',
}

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Nome de usuário único' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome de usuário') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome de usuário') })
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL() })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Email') })
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString({ message: ValidationMessages.IS_STRING('Senha') })
  @MinLength(6, { message: ValidationMessages.MIN_LENGTH('Senha', 6) })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Senha') })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome completo') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome completo') })
  fullName: string;

  @ApiProperty({ required: false, example: '123.456.789-00' })
  @IsString({ message: ValidationMessages.IS_STRING('CPF') })
  @IsOptional()
  cpf?: string;

  @ApiProperty({ required: false, example: '(31) 99999-9999' })
  @IsString({ message: ValidationMessages.IS_STRING('Telefone') })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    default: UserRole.USER,
    required: false,
    description: 'Função do usuário no sistema',
  })
  @IsEnum(UserRole, { message: ValidationMessages.IS_ENUM('Função') })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false, default: true })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('Ativo') })
  @IsOptional()
  active?: boolean;
}
