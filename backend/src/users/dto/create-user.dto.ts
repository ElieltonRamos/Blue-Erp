// src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Nome de usuário único' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome de usuário') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome de usuário') })
  username: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString({ message: ValidationMessages.IS_STRING('Senha') })
  @MinLength(6, { message: ValidationMessages.MIN_LENGTH('Senha', 6) })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Senha') })
  password: string;

  @ApiProperty({
    example: 'user',
    default: 'user',
    required: false,
    description: 'Função do usuário no sistema',
  })
  @IsString({ message: ValidationMessages.IS_STRING('Função') })
  @IsOptional()
  role?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('Ativo') })
  @IsOptional()
  active?: boolean;
}
