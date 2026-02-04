export class MaterialSummaryResponseDto {
  totalMaterials: number;
  activeMaterials: number;
  inactiveMaterials: number;
  totalStockValue: number; // Soma de (currentStock * unitCost) de todos
  materialsLowStock: number; // Quantidade com estoque baixo
  totalItems: number; // Soma de todos os currentStock
}
