/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PaymentBreakdown } from '../entities/sale-report.entity';

export type PaymentMethodKey = keyof PaymentBreakdown;

export function normalizePaymentMethod(method: string): PaymentMethodKey {
  const methodUpper = method.toUpperCase();

  switch (methodUpper) {
    case 'PIX':
      return 'pix';
    case 'DINHEIRO':
      return 'dinheiro';
    case 'CARTAO_CREDITO':
      return 'cartaoCredito';
    case 'CARTAO_DEBITO':
      return 'cartaoDebito';
    case 'CREDITO_LOJA':
      return 'creditoLoja';
    default:
      return 'dinheiro';
  }
}

export function createEmptyBreakdown(): PaymentBreakdown {
  return {
    dinheiro: 0,
    cartaoCredito: 0,
    cartaoDebito: 0,
    pix: 0,
    creditoLoja: 0,
  };
}

export function validateDateFilters(filters: {
  startDate: string;
  endDate: string;
}) {
  const startDate = new Date(filters.startDate + ' 00:00:00');
  const endDate = new Date(filters.endDate + ' 23:59:59');

  if (startDate > endDate) {
    return {
      status: 'ERROR' as const,
      message: 'Data de início não pode ser maior que a data de fim',
    };
  }

  return null;
}

export function processOperatorAggregation(
  operatorName: string,
  total: number,
  salesByOperator: Record<string, any>,
) {
  if (!salesByOperator[operatorName]) {
    salesByOperator[operatorName] = {
      operator: operatorName,
      totalSales: 0,
      revenue: 0,
      paymentBreakdown: createEmptyBreakdown(),
    };
  }

  const opData = salesByOperator[operatorName];
  opData.totalSales++;
  opData.revenue += total;

  return opData;
}

export function processPaymentAggregation(
  method: PaymentMethodKey,
  total: number,
  salesByPaymentMethod: PaymentBreakdown,
  operatorPaymentBreakdown: PaymentBreakdown,
) {
  salesByPaymentMethod[method] += total;
  operatorPaymentBreakdown[method] += total;
}
