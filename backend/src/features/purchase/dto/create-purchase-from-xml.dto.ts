// dto/create-purchase-from-xml.dto.ts — com mensagens em pt-br
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
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

export class ParsedNfeInstallmentDto {
  @ApiProperty({ example: '001' })
  @IsString({ message: 'Número da parcela deve ser texto' })
  @IsNotEmpty({ message: 'Número da parcela é obrigatório' })
  number: string;

  @ApiProperty({ example: '2026-09-29' })
  @IsString({ message: 'Data de vencimento deve ser texto' })
  @IsNotEmpty({ message: 'Data de vencimento é obrigatória' })
  dueDate: string;

  @ApiProperty({ example: 2378.4 })
  @IsNumber({}, { message: 'Valor da parcela deve ser um número' })
  @Min(0, { message: 'Valor da parcela não pode ser negativo' })
  value: number;
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
