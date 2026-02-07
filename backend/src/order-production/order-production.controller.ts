/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductionStatus } from 'generated/prisma/client';
import { ProductionService } from './order-production.service';

@ApiTags('Production')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas produções com filtros opcionais' })
  @ApiQuery({ name: 'status', required: false, enum: ProductionStatus })
  @ApiQuery({ name: 'productionLocation', required: false })
  findAll(
    @Query('status') status?: ProductionStatus,
    @Query('productionLocation') productionLocation?: string,
  ) {
    return this.productionService.findAll({ status, productionLocation });
  }

  @Get('location/:location')
  @ApiOperation({ summary: 'Listar produções por local de produção' })
  @ApiParam({ name: 'location', example: 'LOCAL_01' })
  findByLocation(@Param('location') location: string) {
    return this.productionService.findByLocation(location);
  }

  @Get('metrics/:location')
  @ApiOperation({ summary: 'Obter métricas de produção por local' })
  @ApiParam({ name: 'location', example: 'LOCAL_01' })
  getMetrics(@Param('location') location: string) {
    return this.productionService.getMetricsByLocation(location);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar produção (PENDING -> IN_PROGRESS)' })
  @ApiParam({ name: 'id', description: 'ID da produção' })
  startProduction(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.startProduction(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar produção (IN_PROGRESS -> COMPLETED)' })
  @ApiParam({ name: 'id', description: 'ID da produção' })
  completeProduction(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.completeProduction(id);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Entregar produção (marca deliveredAt)' })
  @ApiParam({ name: 'id', description: 'ID da produção' })
  deliverProduction(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.deliverProduction(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar produção' })
  @ApiParam({ name: 'id', description: 'ID da produção' })
  cancelProduction(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.cancelProduction(id);
  }
}
