// dto/create-manual-purchase.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
  Length,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualPurchaseItemDto {
  @ApiProperty({ example: 'Tecido veludo marrom' })
  @IsString({ message: 'Descrição deve ser texto' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ example: 100 })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ example: 6.37 })
  @IsNumber({}, { message: 'Custo unitário deve ser um número' })
  @Min(0, { message: 'Custo unitário não pode ser negativo' })
  unitCost: number;

  @ApiProperty({ example: 637 })
  @IsNumber({}, { message: 'Total do item deve ser um número' })
  @Min(0, { message: 'Total do item não pode ser negativo' })
  total: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'ID do produto deve ser um número inteiro' })
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'ID da matéria-prima deve ser um número inteiro' })
  materialId?: number;
}

export class ManualInstallmentDto {
  @ApiProperty({ example: '001' })
  @IsString({ message: 'Número da parcela deve ser texto' })
  @IsNotEmpty({ message: 'Número da parcela é obrigatório' })
  number: string;

  @ApiProperty({ example: '2026-10-15' })
  @IsString({ message: 'Data de vencimento deve ser texto' })
  @IsNotEmpty({ message: 'Data de vencimento é obrigatória' })
  dueDate: string;

  @ApiProperty({ example: 318.5 })
  @IsNumber({}, { message: 'Valor da parcela deve ser um número' })
  @Min(0, { message: 'Valor da parcela não pode ser negativo' })
  value: number;
}

export class CreateManualPurchaseDto {
  @ApiProperty({ example: 3 })
  @IsInt({ message: 'ID do fornecedor deve ser um número inteiro' })
  supplierId: number;

  @ApiPropertyOptional({ example: 'RECIBO-042' })
  @IsOptional()
  @IsString({ message: 'Número/referência deve ser texto' })
  invoiceNumber?: string;

  @ApiPropertyOptional({
    example: '123456789',
    description: 'Inscrição estadual da transportadora',
  })
  @IsOptional()
  @IsString({
    message: 'Inscrição estadual da transportadora deve ser texto',
  })
  @MaxLength(20, {
    message:
      'Inscrição estadual da transportadora deve ter no máximo 20 caracteres',
  })
  transportStateRegistration?: string;

  @ApiPropertyOptional({
    example: 'Belo Horizonte',
    description: 'Município da transportadora',
  })
  @IsOptional()
  @IsString({ message: 'Cidade da transportadora deve ser texto' })
  transportCity?: string;

  @ApiPropertyOptional({
    example: 'MG',
    description: 'UF da transportadora',
  })
  @IsOptional()
  @IsString({ message: 'Estado da transportadora deve ser texto' })
  @Length(2, 2, {
    message: 'Estado (UF) da transportadora deve ter 2 caracteres',
  })
  transportState?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'RNTC/ANTT do veículo de transporte',
  })
  @IsOptional()
  @IsString({ message: 'RNTC deve ser texto' })
  @MaxLength(20, { message: 'RNTC deve ter no máximo 20 caracteres' })
  transportRntc?: string;

  @ApiProperty({ type: [ManualPurchaseItemDto] })
  @IsArray({ message: 'Itens deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => ManualPurchaseItemDto)
  items: ManualPurchaseItemDto[];

  @ApiProperty({ type: [ManualInstallmentDto] })
  @IsArray({ message: 'Parcelas deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => ManualInstallmentDto)
  installments: ManualInstallmentDto[];
}
