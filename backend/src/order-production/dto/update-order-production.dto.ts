import { PartialType } from '@nestjs/swagger';
import { CreateOrderProductionDto } from './create-order-production.dto';

export class UpdateOrderProductionDto extends PartialType(CreateOrderProductionDto) {}
