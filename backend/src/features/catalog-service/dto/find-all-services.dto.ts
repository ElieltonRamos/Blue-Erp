import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ValidationMessages } from 'src/common/validation-messages';

export class FindAllServicesDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_NUMBER('Página') })
  @Min(1, { message: ValidationMessages.MIN('Página', 1) })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_NUMBER('Limite') })
  @Min(1, { message: ValidationMessages.MIN('Limite', 1) })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'name', default: 'name' })
  @IsString({ message: ValidationMessages.IS_STRING('Campo de ordenação') })
  @IsOptional()
  sortKey?: string = 'name';

  @ApiPropertyOptional({
    example: 'asc',
    default: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsIn(['asc', 'desc'], { message: ValidationMessages.IS_ENUM('Ordem') })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    example: 'óleo',
    description: 'Busca por nome ou código',
  })
  @IsString({ message: ValidationMessages.IS_STRING('Busca') })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @Type(() => Boolean)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('Ativo') })
  @IsOptional()
  active?: boolean;
}
