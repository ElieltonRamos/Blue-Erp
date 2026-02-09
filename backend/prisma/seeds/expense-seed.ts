import { PrismaClient } from 'generated/prisma/client';

export async function seedExpenses(prisma: PrismaClient) {
  await prisma.expense.createMany({
    data: [
      {
        supplier: 'Distribuidora Alimentos ABC',
        description: 'Compra de insumos - farinha, açúcar e leite',
        value: 450.0,
        datePayment: new Date('2026-02-01'),
        status: 'PAGO',
      },
      {
        supplier: 'Energia Elétrica - SP',
        description: 'Conta de energia - Janeiro/2026',
        value: 380.5,
        datePayment: new Date('2026-02-05'),
        status: 'PAGO',
      },
      {
        supplier: 'Fornecedor Carnes Premium',
        description: 'Compra de frango e queijo',
        value: 620.0,
        datePayment: new Date('2026-02-15'),
        status: 'PENDENTE',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Expenses seed');
}
