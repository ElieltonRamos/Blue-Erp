import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
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
import { OnlineMenuSettingsService } from './online-menu-settings.service.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { UpdateOnlineMenuSettingsDto } from './dto/update-online-menu-settings.dto.js';
import { ReplaceOpeningHoursDto } from './dto/opening-hour.dto.js';
import { OnlineMenuSettingsResponseDto } from './dto/online-menu-settings-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  userId: number;
}

@ApiTags('company')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly onlineMenuSettingsService: OnlineMenuSettingsService,
  ) {}

  // Quem executou a ação, para os logs dos services
  private actorOf(user: AuthenticatedUser): string {
    return String(user.userId);
  }

  @Public()
  @Get('business-type')
  getBusinessType() {
    return this.companyService.getBusinessType();
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
  getCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.companyService.getCompany(this.actorOf(user));
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
  update(
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.update(updateCompanyDto, this.actorOf(user));
  }

  @Delete()
  @ApiOperation({ summary: 'Deletar empresa (reset config)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Empresa deletada com sucesso',
  })
  deleteCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.companyService.deleteCompany(this.actorOf(user));
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
    @CurrentUser() user: AuthenticatedUser,
    @Body('certificadoSenha') certificadoSenha: string,
    @Body('expirationDate') expirationDate?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const uploadedFile = {
      originalname: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    };

    return this.companyService.uploadCompanyCertificate(
      uploadedFile,
      certificadoSenha,
      this.actorOf(user),
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
  deleteCertificate(@CurrentUser() user: AuthenticatedUser) {
    return this.companyService.deleteCertificate(this.actorOf(user));
  }

  @Get('online-menu')
  @ApiOperation({ summary: 'Buscar configurações do cardápio online' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configurações e horários de funcionamento',
    type: OnlineMenuSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não cadastrada',
  })
  getOnlineMenuSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.onlineMenuSettingsService.getSettings(this.actorOf(user));
  }

  @Patch('online-menu')
  @ApiOperation({
    summary: 'Atualizar configurações do cardápio online',
    description:
      'Todos os campos são opcionais. Enviar `null` em um campo opcional limpa o valor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configurações atualizadas',
    type: OnlineMenuSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não cadastrada',
  })
  updateOnlineMenuSettings(
    @Body() dto: UpdateOnlineMenuSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.onlineMenuSettingsService.updateSettings(
      dto,
      this.actorOf(user),
    );
  }

  @Put('online-menu/opening-hours')
  @ApiOperation({
    summary: 'Substituir todos os horários de funcionamento',
    description: 'Envie `{ "hours": [] }` para remover todos os horários.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Horários substituídos',
    type: OnlineMenuSettingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Horários inválidos ou sobrepostos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Empresa não cadastrada',
  })
  replaceOpeningHours(
    @Body() dto: ReplaceOpeningHoursDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.onlineMenuSettingsService.replaceOpeningHours(
      dto,
      this.actorOf(user),
    );
  }
}
