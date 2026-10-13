// dto/create-purchase-from-xml.dto.ts — com mensagens em pt-br
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
  Length,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParsedNfeInstallmentDto } from './parsed-nfe.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ReconciledPurchaseItemDto {
  @ApiProperty({ example: '01562' })
  @IsString({ message: 'Código do produto no fornecedor deve ser texto' })
  @IsNotEmpty({ message: 'Código do produto no fornecedor é obrigatório' })
  supplierProductCode: string;

  @ApiProperty({ example: 'TECIDO VELUDO PAVIA 12 MARROM' })
  @IsString({ message: 'Descrição deve ser texto' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ example: '60019200' })
  @IsString({ message: 'NCM deve ser texto' })
  @IsNotEmpty({ message: 'NCM é obrigatório' })
  ncm: string;

  @ApiProperty({ example: 981.8 })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ example: 6.37 })
  @IsNumber({}, { message: 'Custo unitário deve ser um número' })
  @Min(0, { message: 'Custo unitário não pode ser negativo' })
  unitCost: number;

  @ApiProperty({ example: 6254.07 })
  @IsNumber({}, { message: 'Total do item deve ser um número' })
  @Min(0, { message: 'Total do item não pode ser negativo' })
  total: number;

  @ApiProperty({ required: false })
  @IsNumber({}, { message: 'ID do produto deve ser um número' })
  @IsOptional()
  productId?: number;

  @ApiProperty({ required: false })
  @IsNumber({}, { message: 'ID da matéria-prima deve ser um número' })
  @IsOptional()
  materialId?: number;
}

export class CreatePurchaseFromXmlDto {
  @ApiProperty({ example: '16669045000274' })
  @IsString({ message: 'CNPJ do fornecedor deve ser texto' })
  @IsNotEmpty({ message: 'CNPJ do fornecedor é obrigatório' })
  supplierCnpj: string;

  @ApiProperty({ example: 'EDANTEX COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
  @IsString({ message: 'Nome do fornecedor deve ser texto' })
  @IsNotEmpty({ message: 'Nome do fornecedor é obrigatório' })
  supplierName: string;

  @ApiProperty({
    required: false,
    example: '123456789',
    description: 'Inscrição estadual do fornecedor (emitente)',
  })
  @IsString({ message: 'Inscrição estadual do fornecedor deve ser texto' })
  @MaxLength(20, {
    message:
      'Inscrição estadual do fornecedor deve ter no máximo 20 caracteres',
  })
  @IsOptional()
  supplierStateRegistration?: string;

  @ApiProperty({
    required: false,
    example: 'Belo Horizonte',
    description: 'Município do fornecedor (emitente)',
  })
  @IsString({ message: 'Cidade do fornecedor deve ser texto' })
  @IsOptional()
  supplierCity?: string;

  @ApiProperty({
    required: false,
    example: 'MG',
    description: 'UF do fornecedor (emitente)',
  })
  @IsString({ message: 'Estado do fornecedor deve ser texto' })
  @Length(2, 2, { message: 'Estado (UF) do fornecedor deve ter 2 caracteres' })
  @IsOptional()
  supplierState?: string;

  @ApiProperty({
    required: false,
    example: '123456789',
    description: 'Inscrição estadual da transportadora',
  })
  @IsString({
    message: 'Inscrição estadual da transportadora deve ser texto',
  })
  @MaxLength(20, {
    message:
      'Inscrição estadual da transportadora deve ter no máximo 20 caracteres',
  })
  @IsOptional()
  transportStateRegistration?: string;

  @ApiProperty({
    required: false,
    example: 'Belo Horizonte',
    description: 'Município da transportadora',
  })
  @IsString({ message: 'Cidade da transportadora deve ser texto' })
  @IsOptional()
  transportCity?: string;

  @ApiProperty({
    required: false,
    example: 'MG',
    description: 'UF da transportadora',
  })
  @IsString({ message: 'Estado da transportadora deve ser texto' })
  @Length(2, 2, {
    message: 'Estado (UF) da transportadora deve ter 2 caracteres',
  })
  @IsOptional()
  transportState?: string;

  @ApiProperty({
    required: false,
    example: '12345678',
    description: 'RNTC/ANTT do veículo de transporte',
  })
  @IsString({ message: 'RNTC deve ser texto' })
  @MaxLength(20, { message: 'RNTC deve ter no máximo 20 caracteres' })
  @IsOptional()
  transportRntc?: string;

  @ApiProperty({ example: '40771481000153' })
  @IsString({ message: 'CNPJ do destinatário deve ser texto' })
  @IsNotEmpty({ message: 'CNPJ do destinatário é obrigatório' })
  destCnpj: string;

  @ApiProperty({ example: '25278' })
  @IsString({ message: 'Número da nota fiscal deve ser texto' })
  @IsNotEmpty({ message: 'Número da nota fiscal é obrigatório' })
  invoiceNumber: string;

  @ApiProperty({ example: '31260916669045000274550060000252781383650827' })
  @IsString({ message: 'Chave de acesso deve ser texto' })
  @IsNotEmpty({ message: 'Chave de acesso é obrigatória' })
  fiscalKey: string;

  @ApiProperty()
  @IsString({ message: 'XML da nota fiscal deve ser texto' })
  @IsNotEmpty({ message: 'XML da nota fiscal é obrigatório' })
  fiscalXml: string;

  @ApiProperty({ type: [ReconciledPurchaseItemDto] })
  @IsArray({ message: 'Itens deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => ReconciledPurchaseItemDto)
  items: ReconciledPurchaseItemDto[];

  @ApiProperty({ type: [ParsedNfeInstallmentDto] })
  @IsArray({ message: 'Parcelas deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => ParsedNfeInstallmentDto)
  installments: ParsedNfeInstallmentDto[];
}
