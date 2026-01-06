// src/users/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: ValidationMessages.IS_EMAIL() })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Email') })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString({ message: ValidationMessages.IS_STRING('Senha') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Senha') })
  password: string;
}
