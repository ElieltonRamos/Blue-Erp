import { ApiProperty } from '@nestjs/swagger';
import { Expense } from 'generated/prisma/client';

export class ExpenseResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Fornecedor ABC' })
  supplier: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty({ example: 1250.5 })
  value: number;

  @ApiProperty({ example: '2026-02-03T00:00:00.000Z' })
  datePayment: Date;

  @ApiProperty({ enum: ['Pago', 'Pendente', 'Atrasado'], example: 'Pendente' })
  status: 'Pago' | 'Pendente' | 'Atrasado';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Expense) {
    Object.assign(this, {
      ...partial,
      value: Number(partial.value),
      status: partial.status as 'Pago' | 'Pendente' | 'Atrasado',
    });
  }
}
