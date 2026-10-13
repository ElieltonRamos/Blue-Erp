// dto/parsed-nfe.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ParsedNfeItemDto {
  @ApiProperty({
    description: 'Código do produto no fornecedor (cProd)',
    example: '01562',
  })
  supplierProductCode: string;

  @ApiProperty({
    description: 'Descrição do produto na nota (xProd)',
    example: 'TECIDO VELUDO PAVIA 12 MARROM',
  })
  description: string;

  @ApiProperty({ description: 'NCM do produto', example: '60019200' })
  ncm: string;

  @ApiProperty({ description: 'Unidade comercial (uCom)', example: 'MT' })
  unit: string;

  @ApiProperty({ description: 'Quantidade comercial (qCom)', example: 981.8 })
  quantity: number;

  @ApiProperty({ description: 'Valor unitário (vUnCom)', example: 6.37 })
  unitCost: number;

  @ApiProperty({ description: 'Valor total do item (vProd)', example: 6254.07 })
  total: number;
}

export class ParsedNfeInstallmentDto {
  @ApiProperty({ description: 'Número da duplicata (nDup)', example: '001' })
  @IsString({ message: 'Número da parcela deve ser texto' })
  @IsNotEmpty({ message: 'Número da parcela é obrigatório' })
  number: string;

  @ApiProperty({
    description: 'Data de vencimento (dVenc)',
    example: '2026-09-29',
  })
  @IsString({ message: 'Data de vencimento deve ser texto' })
  @IsNotEmpty({ message: 'Data de vencimento é obrigatória' })
  dueDate: string;

  @ApiProperty({ description: 'Valor da duplicata (vDup)', example: 2378.4 })
  @IsNumber({}, { message: 'Valor da parcela deve ser um número' })
  @Min(0, { message: 'Valor da parcela não pode ser negativo' })
  value: number;
}

export class ParsedNfeDto {
  @ApiProperty({
    description: 'CNPJ do emitente (fornecedor)',
    example: '16669045000274',
  })
  supplierCnpj: string;

  @ApiProperty({
    description: 'Razão social do emitente',
    example: 'EDANTEX COMERCIO IMPORTACAO E EXPORTACAO LTDA.',
  })
  supplierName: string;

  @ApiProperty({
    required: false,
    description: 'Inscrição estadual do emitente (emit.IE)',
    example: '123456789',
  })
  supplierStateRegistration?: string;

  @ApiProperty({
    required: false,
    description: 'Município do emitente (emit.enderEmit.xMun)',
    example: 'Belo Horizonte',
  })
  supplierCity?: string;

  @ApiProperty({
    required: false,
    description: 'UF do emitente (emit.enderEmit.UF)',
    example: 'MG',
  })
  supplierState?: string;

  @ApiProperty({
    required: false,
    description: 'Inscrição estadual da transportadora (transp.transporta.IE)',
    example: '123456789',
  })
  transportStateRegistration?: string;

  @ApiProperty({
    required: false,
    description: 'Município da transportadora (transp.transporta.xMun)',
    example: 'Belo Horizonte',
  })
  transportCity?: string;

  @ApiProperty({
    required: false,
    description: 'UF da transportadora (transp.transporta.UF)',
    example: 'MG',
  })
  transportState?: string;

  @ApiProperty({
    required: false,
    description: 'RNTC/ANTT do veículo de transporte (transp.veicTransp.RNTC)',
    example: '12345678',
  })
  transportRntc?: string;

  @ApiProperty({ description: 'Número da nota fiscal (nNF)', example: '25278' })
  invoiceNumber: string;

  @ApiProperty({
    description: 'Chave de acesso da NFe (44 dígitos)',
    example: '31260916669045000274550060000252781383650827',
  })
  fiscalKey: string;

  @ApiProperty({
    description: 'Itens da nota fiscal',
    type: [ParsedNfeItemDto],
  })
  items: ParsedNfeItemDto[];

  @ApiProperty({
    description:
      'Parcelas/duplicatas da nota (vazio quando a nota não tem cobr.dup — não gera contas a pagar)',
    type: [ParsedNfeInstallmentDto],
  })
  installments: ParsedNfeInstallmentDto[];

  @ApiProperty({ description: 'Valor total da nota (vNF)', example: 9513.6 })
  totalValue: number;

  @ApiProperty({
    description: 'CNPJ do destinatário da nota (dest.CNPJ)',
    example: '40771481000153',
  })
  destCnpj: string;
}
