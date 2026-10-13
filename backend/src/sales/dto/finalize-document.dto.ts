import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalePaymentDto } from '../../sales/dto/create-sale.dto.js';

export class FinalizeDocumentDto {
  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ example: '5102', required: false })
  @IsOptional()
  @IsString()
  cfop?: string;

  @ApiProperty({ type: [CreateSalePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments: CreateSalePaymentDto[];
}
