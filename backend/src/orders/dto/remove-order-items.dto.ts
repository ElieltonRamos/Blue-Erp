import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveOrderItemDto {
  @ApiProperty({ description: 'ID do item do pedido', example: 42 })
  @IsNumber()
  id!: number;

  @ApiProperty({
    description: 'Quantidade a decrementar (delta, sempre positivo)',
    example: 1,
    minimum: 0.001,
  })
  @IsNumber()
  @Min(0.001)
  quantity!: number;
}

export class RemoveOrderItemsDto {
  @ApiProperty({
    type: [RemoveOrderItemDto],
    description: 'Itens a reduzir/remover do pedido',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RemoveOrderItemDto)
  items!: RemoveOrderItemDto[];
}
