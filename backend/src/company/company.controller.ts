import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  HttpStatus,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@ApiTags('company')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Delete()
  @ApiOperation({ summary: 'Deletar empresa (reset config)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Empresa deletada com sucesso',
  })
  deleteCompany() {
    return this.companyService.deleteCompany();
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

  @Post('nfceIncrement')
  @ApiOperation({ summary: 'Incrementa número NFC-e' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Número incrementado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não configurada',
  })
  incrementNfceNumber() {
    return this.companyService.incrementNfceNumber();
  }

  @Get('certificado')
  @ApiOperation({ summary: 'Status certificado digital' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status do certificado',
  })
  getCertificadoConfig() {
    return this.companyService.getCertificateConfig();
  }

  @Get('certificado/buffer')
  @ApiOperation({ summary: 'Obter buffer do certificado digital' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Buffer do certificado retornado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Certificado não encontrado',
  })
  getCertificadoBuffer() {
    return this.companyService.getCertificateBuffer();
  }

  @Patch('certificate')
  @ApiOperation({ summary: 'Upload certificado digital' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificado enviado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Arquivo inválido',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não configurada',
  })
  @UseInterceptors(FileInterceptor('certificado'))
  uploadCompanyCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Body('certificadoSenha') certificadoSenha: string,
    @Body('expirationDate') expirationDate?: string,
  ) {
    // Valida se o arquivo existe
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    // Converte para o formato esperado pelo service
    const uploadedFile = {
      originalname: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.companyService.uploadCompanyCertificate(
      uploadedFile,
      certificadoSenha,
      expirationDate ? new Date(expirationDate) : undefined,
    );
  }

  @Delete('certificate')
  @ApiOperation({ summary: 'Deletar certificado digital' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificado removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Certificado não encontrado',
  })
  deleteCertificate() {
    return this.companyService.deleteCertificate();
  }
}
