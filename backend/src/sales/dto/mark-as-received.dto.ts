import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class MarkAsReceivedDto {
  @ApiProperty({
    description: 'Lista de IDs das vendas a serem marcadas como recebidas',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'salesIds deve ser um array' })
  @IsInt({ each: true, message: 'Todos os IDs devem ser números inteiros' })
  @ArrayMinSize(1, { message: 'É necessário enviar pelo menos um ID de venda' })
  salesIds: number[];
}
