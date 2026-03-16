// src/production/order-production.controller.ts (atualizado)
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductionStatus } from 'generated/prisma/client';
import { ProductionService } from './order-production.service';
import { BatchProductionDto } from './dto/batch-production.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Production')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('batch/start')
  @ApiOperation({ summary: 'Iniciar múltiplas produções' })
  async batchStart(@Body() dto: BatchProductionDto) {
    const results = await Promise.allSettled(
      dto.productionIds.map((id) => this.productionService.startProduction(id)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    return {
      success: failed.length === 0,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      message:
        failed.length === 0
          ? `${succeeded.length} produções iniciadas`
          : `${succeeded.length} iniciadas, ${failed.length} falharam`,
    };
  }

  @Post('batch/complete')
  @ApiOperation({ summary: 'Completar múltiplas produções' })
  async batchComplete(@Body() dto: BatchProductionDto) {
    const results = await Promise.allSettled(
      dto.productionIds.map((id) =>
        this.productionService.completeProduction(id),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    return {
      success: failed.length === 0,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      message:
        failed.length === 0
          ? `${succeeded.length} produções completadas`
          : `${succeeded.length} completadas, ${failed.length} falharam`,
    };
  }

  @Post('batch/deliver')
  @ApiOperation({ summary: 'Entregar múltiplas produções' })
  async batchDeliver(@Body() dto: BatchProductionDto) {
    const results = await Promise.allSettled(
      dto.productionIds.map((id) =>
        this.productionService.deliverProduction(id),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    return {
      success: failed.length === 0,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      message:
        failed.length === 0
          ? `${succeeded.length} produções entregues`
          : `${succeeded.length} entregues, ${failed.length} falharam`,
    };
  }

  @Post('batch/cancel')
  @ApiOperation({ summary: 'Cancelar múltiplas produções' })
  async batchCancel(@Body() dto: BatchProductionDto) {
    const results = await Promise.allSettled(
      dto.productionIds.map((id) =>
        this.productionService.cancelProduction(id),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    return {
      success: failed.length === 0,
      total: results.length,
      succeeded: succeeded.length,
      failed: failed.length,
      message:
        failed.length === 0
          ? `${succeeded.length} produções canceladas`
          : `${succeeded.length} canceladas, ${failed.length} falharam`,
    };
  }

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
