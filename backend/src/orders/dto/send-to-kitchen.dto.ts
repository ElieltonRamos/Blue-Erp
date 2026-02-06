import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SendToKitchenDto {
  @ApiPropertyOptional({
    description: 'Prioridade do pedido (para futuro uso com OrderProduction)',
    example: 0,
    default: 0,
  })
  @IsInt()
  @IsOptional()
  priority?: number = 0;
}

export class SendToKitchenResponseDto {
  @ApiProperty({ description: 'ID do pedido', example: 1 })
  orderId: number;

  @ApiProperty({
    description: 'Data/hora enviado para cozinha',
    example: '2024-01-15T10:05:00Z',
  })
  kitchenSentAt: Date;

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Pedido enviado para cozinha com sucesso',
  })
  message: string;
}
