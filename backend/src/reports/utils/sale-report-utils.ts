/* eslint-disable @typescript-eslint/no-unsafe-return */
export function normalizePaymentMethod(
  method: string,
): 'pix' | 'cash' | 'card' | 'promissoryNote' {
  const methodUpper = method.toUpperCase();

  switch (methodUpper) {
    case 'PIX':
      return 'pix';
    case 'DINHEIRO':
      return 'cash';
    case 'CARTAO':
      return 'card';
    case 'NOTINHA':
      return 'promissoryNote';
    default:
      return 'cash'; // default fallback
  }
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
      paymentBreakdown: {
        pix: 0,
        cash: 0,
        card: 0,
        promissoryNote: 0,
      },
    };
  }

  const opData = salesByOperator[operatorName];
  opData.totalSales++;
  opData.revenue += total;

  return opData;
}

export function processPaymentAggregation(
  method: 'pix' | 'cash' | 'card' | 'promissoryNote',
  total: number,
  salesByPaymentMethod: Record<
    'pix' | 'cash' | 'card' | 'promissoryNote',
    number
  >,
  operatorPaymentBreakdown: Record<
    'pix' | 'cash' | 'card' | 'promissoryNote',
    number
  >,
) {
  salesByPaymentMethod[method] += total;
  operatorPaymentBreakdown[method] += total;
}
