import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CloseTabItemDto {
  @IsNumber()
  id!: number;

  @IsNumber()
  @Min(0)
  serviceCharge!: number;
}

export class CloseTabDto {
  @ApiPropertyOptional({ example: 18.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;

  @ApiPropertyOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloseTabItemDto)
  @IsOptional()
  items?: CloseTabItemDto[];
}
