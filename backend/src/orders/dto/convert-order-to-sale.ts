import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConvertOrderToSaleDto {
  @ApiProperty({
    description: 'Método de pagamento',
    example: 'DINHEIRO',
  })
  @IsString({ message: 'Método de pagamento deve ser uma string' })
  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  paymentMethod: string;

  @ApiProperty({
    description: 'ID do cliente (padrão: 1 - Cliente à vista)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do cliente deve ser um número inteiro' })
  @Min(1, { message: 'ID do cliente deve ser maior que 0' })
  clientId?: number;

  @ApiProperty({
    description: 'Desconto aplicado na venda',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  @Min(0, { message: 'Desconto não pode ser negativo' })
  discount?: number;

  @ApiProperty({
    description: 'CFOP da operação',
    example: '5102',
  })
  @IsString({ message: 'CFOP deve ser uma string' })
  @IsNotEmpty({ message: 'CFOP é obrigatório' })
  cfop: string;
}
