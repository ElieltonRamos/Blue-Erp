import { Decimal } from '@prisma/client/runtime/client';
import type { BusinessPartner } from 'generated/prisma/client';
import type { Nfe55Options } from 'src/features/fiscal-module/entities/nfe.entity';
import { FiscalException } from 'src/features/fiscal-module/fiscal.exception';

export const digits = (s?: string | null): string =>
  (s ?? '').replace(/\D/g, '');

export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function toNumber(value: unknown, decimals: number): number {
  let n: number;
  if (value instanceof Decimal) {
    n = value.toNumber();
  } else {
    n = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  }
  if (Number.isNaN(n)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/** Rateia o desconto da venda proporcionalmente ao valor de cada item; o último item recebe o resto. */
export function distributeDiscount<T extends { qCom: number; vUnCom: number }>(
  items: T[],
  totalDiscount: number,
): Array<T & { vDesc: number }> {
  const zero = () => items.map((item) => ({ ...item, vDesc: 0 }));

  if (totalDiscount <= 0 || items.length === 0) return zero();

  const totalProd = items.reduce((sum, i) => sum + i.qCom * i.vUnCom, 0);
  if (totalProd <= 0) return zero();

  let allocated = 0;
  return items.map((item, index) => {
    const itemProd = item.qCom * item.vUnCom;
    const isLast = index === items.length - 1;

    const vDesc = isLast
      ? toNumber(totalDiscount - allocated, 2)
      : toNumber((itemProd / totalProd) * totalDiscount, 2);

    allocated += vDesc;
    return { ...item, vDesc };
  });
}

type Transporta = NonNullable<Nfe55Options['transp']['transporta']>;

export function toTransporta(p: BusinessPartner): Transporta {
  const doc = digits(p.document);
  if (doc.length !== 11 && doc.length !== 14) {
    throw new FiscalException(
      `Transportadora "${p.name}" sem CNPJ/CPF válido no cadastro`,
    );
  }

  const ie =
    p.stateRegistration?.trim().toUpperCase() === 'ISENTO'
      ? 'ISENTO'
      : digits(p.stateRegistration);

  return {
    ...(doc.length === 14 ? { CNPJ: doc } : { CPF: doc }),
    xNome: p.name.slice(0, 60),
    ...(ie ? { IE: ie } : {}),
    ...(p.address ? { xEnder: p.address.slice(0, 60) } : {}),
    ...(p.city ? { xMun: p.city.slice(0, 60) } : {}),
    ...(p.state ? { UF: p.state.toUpperCase() } : {}),
  };
}
