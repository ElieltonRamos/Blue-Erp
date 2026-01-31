// src/users/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages } from '../../common/validation-messages.js';

export class LoginDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome de usuário') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome de usuário') })
  username: string;

  @ApiProperty({ example: 'senha123' })
  @IsString({ message: ValidationMessages.IS_STRING('Senha') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Senha') })
  password: string;
}
