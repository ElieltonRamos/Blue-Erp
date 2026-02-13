import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class MarkAsReceivedDto {
  @ApiProperty({
    description: 'Lista de IDs das vendas a serem marcadas como recebidas',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  salesIds: number[];
}
