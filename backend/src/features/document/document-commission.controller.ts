import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DocumentCommissionService } from './document-commission.service.js';
import { CloseCommissionDto } from './dto/close-commission.dto.js';
import { PayCommissionDto } from './dto/pay-commission.dto.js';
import { FindCommissionItemsDto } from './dto/find-commission-items.dto.js';
import { CommissionSummaryResponseDto } from './dto/commission-summary-response.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  JwtAuthGuard,
  JwtPayload,
} from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Document Commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('document-commissions')
export class DocumentCommissionController {
  constructor(private readonly commissionService: DocumentCommissionService) {}

  @Post('close')
  @ApiOperation({ summary: 'Fechar comissão de um mecânico em um período' })
  @ApiResponse({
    status: 201,
    description: 'Comissão fechada com sucesso',
    type: CommissionSummaryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou nada a fechar' })
  close(
    @Body() dto: CloseCommissionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CommissionSummaryResponseDto> {
    return this.commissionService.closeCommission(dto, user.username);
  }

  @Post('pay')
  @ApiOperation({ summary: 'Marcar comissões fechadas como pagas' })
  @ApiResponse({
    status: 201,
    description: 'Comissões marcadas como pagas',
    type: CommissionSummaryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nenhuma comissão pendente encontrada',
  })
  pay(
    @Body() dto: PayCommissionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CommissionSummaryResponseDto> {
    return this.commissionService.payCommission(dto, user.username);
  }

  @Get()
  @ApiOperation({ summary: 'Listar itens de comissão (aberto/fechado/pago)' })
  @ApiResponse({ status: 200, description: 'Lista de itens' })
  findItems(@Query() query: FindCommissionItemsDto) {
    return this.commissionService.findItems(query);
  }
}
