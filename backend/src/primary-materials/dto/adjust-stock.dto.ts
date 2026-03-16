import { IsNumber, IsString, IsEnum, Min } from 'class-validator';

export enum StockAdjustmentType {
  IN = 'IN', // Entrada
  OUT = 'OUT', // Saída
  SET = 'SET', // Definir valor exato
}

export class AdjustStockDto {
  @IsEnum(StockAdjustmentType, { message: 'Tipo de ajuste inválido' })
  type: StockAdjustmentType;

  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity: number;

  @IsString()
  reason: string; // Motivo do ajuste (ex: "Compra", "Perda", "Correção de inventário")
}
