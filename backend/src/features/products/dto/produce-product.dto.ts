import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { ValidationMessages } from 'src/common/utils/validation';

export class ProduceProductDto {
  @ApiProperty({
    description: 'Quantidade a ser produzida',
    minimum: 0.001,
    example: 10,
  })
  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: ValidationMessages.IS_DECIMAL('A quantidade', 3) },
  )
  @Min(0.001, { message: ValidationMessages.MIN('A quantidade', 0.001) })
  quantity: number;
}
