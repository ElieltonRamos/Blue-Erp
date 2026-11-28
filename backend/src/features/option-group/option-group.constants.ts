import { Prisma } from 'generated/prisma/client';

export const OPTION_GROUP_INCLUDE = {
  options: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  _count: { select: { products: true } },
} satisfies Prisma.OptionGroupInclude;

export type OptionGroupDetail = Prisma.OptionGroupGetPayload<{ include: typeof OPTION_GROUP_INCLUDE }>;

export const PRODUCT_OPTION_GROUP_INCLUDE = {
  group: { include: OPTION_GROUP_INCLUDE },
} satisfies Prisma.ProductOptionGroupInclude;

export type ProductOptionGroupDetail = Prisma.ProductOptionGroupGetPayload<{ include: typeof PRODUCT_OPTION_GROUP_INCLUDE }>;

// Regras de min/max de um grupo. Devolve a mensagem de erro, ou null se válidas.
// Usada pelo grupo e pelo vínculo (que sobrescreve os valores do grupo).
export function getRulesError(min: number, max: number | null, maxPerOption: number | null): string | null {
  if (max !== null && max < min) {
    return 'O máximo do grupo não pode ser menor que o mínimo';
  }

  if (max !== null && maxPerOption !== null && maxPerOption > max) {
    return 'O máximo por opção não pode ser maior que o máximo do grupo';
  }

  return null;
}
