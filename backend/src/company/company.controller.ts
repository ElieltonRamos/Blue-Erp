// src/company/company.controller.ts
import { Controller, Get, Post, Body, Patch, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Configurar empresa (apenas primeira vez)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Empresa configurada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Empresa já cadastrada',
  })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar dados da empresa' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados da empresa retornados',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não configurada',
  })
  getCompany() {
    return this.companyService.getCompany();
  }

  @Patch()
  @ApiOperation({ summary: 'Atualizar dados da empresa' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Empresa atualizada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não configurada',
  })
  update(@Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(updateCompanyDto);
  }

  @Get('configured')
  @ApiOperation({ summary: 'Verificar se empresa está configurada' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status da configuração',
  })
  async isConfigured() {
    const configured = await this.companyService.isCompanyConfigured();
    return { configured };
  }
}
