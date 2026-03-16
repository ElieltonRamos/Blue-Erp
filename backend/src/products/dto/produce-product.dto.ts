// produce-product.dto.ts
import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProduceProductDto {
  @ApiProperty({
    description: 'Quantidade a ser produzida',
    minimum: 0.001,
    example: 10,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;
}
