import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FiscalStatus } from 'generated/prisma/client';
import { CreateSalePaymentDto } from './create-sale.dto';

export class UpdateSaleDto {
  @ApiPropertyOptional({ type: [CreateSalePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  @IsOptional()
  payments?: CreateSalePaymentDto[];

  @ApiPropertyOptional({ example: 15.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ enum: FiscalStatus, example: FiscalStatus.EMITIDA })
  @IsEnum(FiscalStatus)
  @IsOptional()
  fiscalStatus?: FiscalStatus;

  @ApiPropertyOptional({ example: '5102' })
  @IsOptional()
  cfop?: string;
}
