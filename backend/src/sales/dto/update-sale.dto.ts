import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { FiscalStatus } from 'generated/prisma/client';

export class UpdateSaleDto {
  @ApiPropertyOptional({
    description: 'Método de pagamento',
    example: 'CARTAO',
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Desconto aplicado', example: 15.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Venda foi paga', example: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Status fiscal da venda',
    enum: FiscalStatus,
    example: FiscalStatus.EMITIDA,
  })
  @IsEnum(FiscalStatus)
  @IsOptional()
  fiscalStatus?: FiscalStatus;

  @ApiPropertyOptional({ description: 'CFOP da operação', example: '5102' })
  @IsString()
  @IsOptional()
  cfop?: string;
}
