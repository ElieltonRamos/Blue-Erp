import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateOrderItemDto } from './update-order.dto';

export class AddOrderItemsDto {
  @ApiProperty({
    type: [UpdateOrderItemDto],
    description: 'Itens novos a adicionar ao pedido',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items!: UpdateOrderItemDto[];
}
