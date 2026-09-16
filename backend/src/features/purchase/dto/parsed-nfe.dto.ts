// dto/parsed-nfe.dto.ts
import { ApiProperty } from '@nestjs/swagger';

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
  number: string;

  @ApiProperty({
    description: 'Data de vencimento (dVenc)',
    example: '2026-09-29',
  })
  dueDate: string;

  @ApiProperty({ description: 'Valor da duplicata (vDup)', example: 2378.4 })
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
