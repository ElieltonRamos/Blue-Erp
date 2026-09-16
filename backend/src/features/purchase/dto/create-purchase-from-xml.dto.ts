// dto/create-purchase-from-xml.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ParsedNfeInstallmentDto } from './parsed-nfe.dto';

export class ReconciledPurchaseItemDto {
  @ApiProperty({ example: '01562' })
  supplierProductCode: string;

  @ApiProperty({ example: 'TECIDO VELUDO PAVIA 12 MARROM' })
  description: string;

  @ApiProperty({ example: 981.8 })
  quantity: number;

  @ApiProperty({ example: 6.37 })
  unitCost: number;

  @ApiProperty({ example: 6254.07 })
  total: number;

  @ApiProperty({
    required: false,
    description: 'Preenchido se o item for revenda/manufaturado',
  })
  productId?: number;

  @ApiProperty({
    required: false,
    description: 'Preenchido se o item for matéria-prima',
  })
  materialId?: number;
}

export class CreatePurchaseFromXmlDto {
  @ApiProperty({ example: '16669045000274' })
  supplierCnpj: string;

  @ApiProperty({ example: 'EDANTEX COMERCIO IMPORTACAO E EXPORTACAO LTDA.' })
  supplierName: string;

  @ApiProperty({ example: '40771481000153' })
  destCnpj: string;

  @ApiProperty({ example: '25278' })
  invoiceNumber: string;

  @ApiProperty({ example: '31260916669045000274550060000252781383650827' })
  fiscalKey: string;

  @ApiProperty({ description: 'XML bruto original da NFe' })
  fiscalXml: string;

  @ApiProperty({ type: [ReconciledPurchaseItemDto] })
  items: ReconciledPurchaseItemDto[];

  @ApiProperty({ type: [ParsedNfeInstallmentDto] })
  installments: ParsedNfeInstallmentDto[];
}
