import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Nome do fornecedor', example: 'Fornecedor ABC' })
  @IsString()
  @IsNotEmpty()
  supplier: string;

  @ApiProperty({
    description: 'Descrição da despesa',
    example: 'Compra de insumos restaurante',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Valor da despesa', example: 1250.5 })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({
    description: 'Data de pagamento (YYYY-MM-DD)',
    example: '2026-02-03',
  })
  @IsString()
  @IsNotEmpty()
  datePayment: string;

  @ApiProperty({
    enum: ['Pago', 'Pendente', 'Atrasado'],
    example: 'Pendente',
    description: 'Status da despesa',
  })
  @IsEnum(['Pago', 'Pendente', 'Atrasado'])
  @IsNotEmpty()
  status: 'Pago' | 'Pendente' | 'Atrasado';
}
