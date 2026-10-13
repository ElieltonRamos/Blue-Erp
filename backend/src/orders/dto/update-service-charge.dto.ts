import { IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceChargeDto {
  @ApiProperty({
    description: 'Se a taxa de serviço está ativa',
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({
    description: 'Valor total da taxa de serviço em R$',
    example: 15.05,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount!: number;
}
