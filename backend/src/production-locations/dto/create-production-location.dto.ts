import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProductionLocationDto {
  @ApiProperty({
    description: 'Código único do local de produção',
    example: 'LOCAL_01',
  })
  @IsString({ message: 'Código deve ser uma string' })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MaxLength(50, { message: 'Código deve ter no máximo 50 caracteres' })
  code: string;

  @ApiProperty({
    description: 'Nome do local de produção',
    example: 'Cozinha Principal',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do local de produção',
    example: 'Cozinha principal - pratos quentes',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Se o local está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active deve ser um booleano' })
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @Min(0, { message: 'Ordem deve ser maior ou igual a 0' })
  order?: number;
}
