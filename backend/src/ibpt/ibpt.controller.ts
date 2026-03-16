import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { IbptService } from './ibpt.service.js';
import { GetAllIbptQueryDto } from './dto/response-ibpt.dto.js';
import { CreateIbptDto } from './dto/create-ibpt.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@ApiTags('IBPT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ibpt')
export class IbptController {
  constructor(private readonly ibptService: IbptService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todos os registros IBPT',
    description:
      'Retorna uma lista paginada de registros IBPT com ordenação configurável',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos',
  })
  async getAll(@Query() query: GetAllIbptQueryDto) {
    return this.ibptService.getAll(
      query.page,
      query.limit,
      query.sortKey,
      query.sortOrder,
    );
  }

  @Get('ncm/:ncm')
  @ApiOperation({
    summary: 'Buscar registros IBPT por NCM',
    description: 'Retorna todos os registros com o código NCM especificado',
  })
  @ApiParam({
    name: 'ncm',
    description: 'Código NCM (aceita com ou sem formatação)',
    example: '12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Registros encontrados',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro IBPT não encontrado',
  })
  async getByNcm(@Param('ncm') ncm: string) {
    return this.ibptService.getByNcm(ncm);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo registro IBPT',
    description: 'Cria um novo registro de alíquota IBPT',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'NCM já cadastrado na tabela IBPT',
  })
  async create(@Body() createIbptDto: CreateIbptDto) {
    return this.ibptService.create(createIbptDto);
  }

  @Patch('sale/:saleId/update-aliq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar alíquotas IBPT de uma venda',
    description:
      'Atualiza as alíquotas (federal, estadual, municipal) e valor total de tributos de todos os itens de uma venda baseado nos códigos NCM',
  })
  @ApiParam({
    name: 'saleId',
    description: 'ID da venda',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Alíquotas atualizadas com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Venda não encontrada ou venda sem itens',
  })
  updateAliqSale(@Param('saleId') saleId: string) {
    console.log(saleId);
    // await this.ibptService.updateAliqSale(Number(saleId));
    return { message: 'Alíquotas atualizadas com sucesso' };
  }

  @Post('import-csv')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file')) // <- IMPORTANTE: 'file' é o nome do campo
  @ApiOperation({
    summary: 'Importar tabela IBPT via CSV',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'CSV importado com sucesso' })
  async importFromCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV é obrigatório');
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Apenas arquivos CSV são permitidos');
    }

    await this.ibptService.importFromCsv(file.buffer.toString('utf8'));
    return { message: 'CSV importado com sucesso' };
  }
}
