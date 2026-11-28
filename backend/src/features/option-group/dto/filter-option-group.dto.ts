import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionGroupType } from 'generated/prisma/enums';
import { PaginationQueryDto } from 'src/common/utils/pagination-query.dto';
import { ValidationMessages, trim } from 'src/common/utils/validation';

export const OPTION_GROUP_SORT_KEYS = ['id', 'name', 'type', 'createdAt', 'updatedAt'] as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;

export class FilterOptionGroupDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Campo para ordenação', example: 'name', default: 'name', enum: OPTION_GROUP_SORT_KEYS })
  @IsOptional()
  @IsIn(OPTION_GROUP_SORT_KEYS, { message: ValidationMessages.IS_ENUM('O campo de ordenação') })
  sortKey?: (typeof OPTION_GROUP_SORT_KEYS)[number];

  @ApiPropertyOptional({ description: 'Direção da ordenação', example: 'asc', default: 'asc', enum: SORT_ORDERS })
  @IsOptional()
  @IsIn(SORT_ORDERS, { message: ValidationMessages.IS_ENUM('A direção da ordenação') })
  sortOrder?: (typeof SORT_ORDERS)[number];

  @ApiPropertyOptional({ description: 'Busca por nome do grupo', maxLength: 100, example: 'adicionais' })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A busca') })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH('A busca', 100) })
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de grupo', enum: OptionGroupType })
  @IsOptional()
  @IsEnum(OptionGroupType, { message: ValidationMessages.IS_ENUM('O tipo do grupo') })
  type?: OptionGroupType;
}
