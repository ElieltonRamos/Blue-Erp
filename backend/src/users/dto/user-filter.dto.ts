import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform as TransformFn } from 'class-transformer';

export class UserFiltersDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: 'caixa',
    enum: ['caixa', 'garcom', 'admin'],
  })
  @IsOptional()
  @IsEnum(['caixa', 'garcom', 'admin'])
  role?: string;

  @ApiPropertyOptional({
    example: 'local1',
    enum: ['local1', 'local2', 'local3'],
  })
  @IsOptional()
  workplace?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @TransformFn(({ value }) => value === 'true' || value === true) // Converte "true" → true
  @IsBoolean({ message: 'active deve ser true/false' })
  active?: boolean;
}
