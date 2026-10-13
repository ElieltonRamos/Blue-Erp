import { OrderEntity } from './entities/order.entity';

export const ORDER_INCLUDE_FULL = {
  items: {
    include: {
      product: {
        select: { id: true, productionLocation: true, productType: true },
      },
    },
  },
  operator: { select: { id: true, username: true, role: true } },
  closedByOperator: { select: { id: true, username: true, role: true } },
};

export const ORDER_INCLUDE_ITEMS_FULL = {
  items: {
    include: {
      productions: true,
      product: {
        select: { id: true, productType: true, productionLocation: true },
      },
    },
  },
  operator: { select: { id: true, username: true, role: true } },
  closedByOperator: { select: { id: true, username: true, role: true } },
};

export const ORDER_INCLUDE_BASIC = {
  items: true,
  operator: { select: { id: true, username: true, role: true } },
  closedByOperator: { select: { id: true, username: true, role: true } },
};

export function mapOrderToEntity(order: any): OrderEntity {
  return {
    id: order.id,
    type: order.type,
    locationId: order.locationId,
    customerName: order.customerName,
    table: order.table,
    address: order.address,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    finishedAt: order.finishedAt,
    tableOccupiedUntil: order.tableOccupiedUntil,
    operatorId: order.operatorId,
    closedByOperatorId: order.closedByOperatorId,
    serviceCharge: Number(order.serviceCharge ?? 0),
    waiterOpen: order.operator ?? null,
    waiterClose: order.closedByOperator ?? null,
    operator: order.operator ?? null,
    closedByOperator: order.closedByOperator ?? null,
    items:
      order.items?.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        serviceCharge: Number(item.serviceCharge ?? 0),
        operatorId: item.operatorId ?? null,
        kitchenReadyAt: item.kitchenReadyAt,
        orderId: item.orderId,
        productId: item.productId,
        observation: item.observation ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) || [],
  };
}
