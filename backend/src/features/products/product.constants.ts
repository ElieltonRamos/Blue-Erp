import { Prisma, ProductType } from 'generated/prisma/client';

export const TYPES_WITH_COMPOSITION: ProductType[] = [ProductType.MANUFACTURED, ProductType.SEMI_MANUFACTURED];

export const COMPOSITION_INCLUDE = {
  compositionItems: {
    include: {
      material: true,
      subProduct: { select: { id: true, name: true, code: true, quantity: true, unit: true, costPrice: true } },
    },
  },
} satisfies Prisma.ProductInclude;

export const PRODUCT_DETAIL_INCLUDE = {
  category: true,
  ...COMPOSITION_INCLUDE,
  preparationSteps: { orderBy: { order: 'asc' } },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof PRODUCT_DETAIL_INCLUDE }>;
