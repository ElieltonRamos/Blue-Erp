import { OrderEntity } from './entities/order.entity';

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
