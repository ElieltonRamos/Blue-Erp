import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';
import { CompanyResponseDto } from '../../company/dto/company-response.dto';
import { IbptService } from '../../ibpt/ibpt.service';
import { StorageService } from './storage.service';
import { SaleToNfeConverterService } from '../../sales/sale-to-nfe-converte.service';
import {
  NfceAlreadyEmittedException,
  CertificateException,
  SefazException,
  FiscalException,
} from '../fiscal.exception';
import {
  EmissionResult,
  NFeOptions,
  DigitalCertificate,
  NFeConfiguration,
  DanfeConfig,
  SefazReturn,
} from '../entities/fiscal-module.entity';
import { EmitNfceDto } from '../dto/emit-nfce.dto';
import { PrismaService } from 'src/database/prisma.service';
import { generateNFeXML } from '../lib/nfe-xml-builder';
import { NfeSender } from '../lib/nfe-sender';
import { DanfeGenerator } from '../lib/danfe-generator';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmissionService {
  private readonly logger = new Logger(EmissionService.name);
  private readonly sefazTempDir = join(process.cwd(), 'sefaz-temp');

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly ibptService: IbptService,
    private readonly storageService: StorageService,
    private readonly saleToNfeConverter: SaleToNfeConverterService,
  ) {
    if (!existsSync(this.sefazTempDir)) {
      mkdirSync(this.sefazTempDir, { recursive: true });
    }
  }

  async emit(dto: EmitNfceDto): Promise<EmissionResult> {
    this.logger.log(`Iniciando emissão NFC-e para venda ${dto.saleId}`);

    const sale = await this.findSale(dto.saleId);
    this.checkIfAlreadyEmitted(sale);

    const company = await this.companyService.getCompany();
    const certificate = await this.loadCertificate();

    await this.ibptService.updateAliqSale(dto.saleId);

    const nfeData = await this.saleToNfeConverter.convert(dto.saleId);
    this.validateNFeData(nfeData);

    const xml = generateNFeXML(nfeData);
    const accessKey = this.extractAccessKey(xml);

    this.saveXmlDebug(accessKey, xml, 'envio');

    const sefazConfig: NFeConfiguration = {
      environment: company.nfceEnvironment,
      state: company.state,
    };

    const sender = new NfeSender(sefazConfig, certificate);
    this.validateCertificate(sender);

    const sefazReturn = await sender.send(xml, nfeData);

    if (!sefazReturn.success || sefazReturn.statusCode !== '100') {
      await this.handleRejection(dto.saleId, accessKey, sefazReturn);
    }

    if (!sefazReturn.signedXml) {
      this.logger.warn(`XML assinado não retornado para chave ${accessKey}`);
      throw new FiscalException('SEFAZ não retornou o XML assinado');
    }

    this.saveXmlDebug(accessKey, sefazReturn.signedXml, 'retorno');

    const storagePaths = this.storageService.getStoragePaths(
      accessKey,
      new Date(nfeData.ide.dhEmi),
    );

    this.storageService.saveXml(storagePaths.xmlPath, sefazReturn.signedXml);

    let pdfPath = '';
    if (dto.generateDanfe && storagePaths.pdfPath) {
      pdfPath = await this.generateDanfe(
        company,
        nfeData,
        accessKey,
        sefazReturn.signedXml,
        storagePaths.pdfPath,
      );
    }

    await this.updateSaleAsEmitted(dto.saleId, accessKey, sefazReturn.protocol);

    this.logger.log(`NFC-e emitida com sucesso: ${accessKey}`);

    return {
      accessKey,
      protocol: sefazReturn.protocol,
      xmlPath: storagePaths.xmlPath,
      pdfPath,
      status: 'authorized',
      message: 'NFC-e autorizada com sucesso',
    };
  }

  private saveXmlDebug(accessKey: string, xml: string, stage: string): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${stage}_${accessKey}_${timestamp}.xml`;
      writeFileSync(join(this.sefazTempDir, fileName), xml, 'utf8');
    } catch (error) {
      this.logger.warn(`Falha ao salvar XML de debug (${stage}): ${error}`);
    }
  }

  private async findSale(saleId: number) {
    const sale = await this.prisma.client.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new FiscalException('Venda não encontrada', 404);
    }

    return sale;
  }

  private checkIfAlreadyEmitted(sale: {
    fiscalStatus: string;
    fiscalKey: string | null;
  }): void {
    if (sale.fiscalStatus === 'EMITIDA' && sale.fiscalKey) {
      throw new NfceAlreadyEmittedException(sale.fiscalKey);
    }
  }

  private async loadCertificate(): Promise<DigitalCertificate> {
    try {
      const { pfxBuffer, password } =
        await this.companyService.getCertificateBuffer();

      return { pfxBuffer, password };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao carregar certificado digital';
      throw new CertificateException(message);
    }
  }

  private validateNFeData(nfeData: NFeOptions): void {
    if (!nfeData.emit?.CNPJ) {
      throw new FiscalException('CNPJ do emitente é obrigatório');
    }
    if (!nfeData.produtos || nfeData.produtos.length === 0) {
      throw new FiscalException('NFC-e deve conter ao menos um produto');
    }
    if (!nfeData.pag?.tPag || !nfeData.pag?.vPag) {
      throw new FiscalException('Informações de pagamento são obrigatórias');
    }
    if (!nfeData.ide?.nNF || !nfeData.ide?.serie) {
      throw new FiscalException('Número da nota e série são obrigatórios');
    }
  }

  private extractAccessKey(xml: string): string {
    const accessKey = this.storageService.extractAccessKey(xml);

    if (!accessKey) {
      throw new FiscalException('Erro ao gerar chave de acesso');
    }

    return accessKey;
  }

  private validateCertificate(sender: NfeSender): void {
    try {
      sender.signer.validateCertificate();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Certificado inválido';
      throw new CertificateException(message);
    }
  }

  private async handleRejection(
    saleId: number,
    accessKey: string,
    sefazReturn: SefazReturn,
  ): Promise<never> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'ERRO',
        fiscalKey: accessKey,
        fiscalProtocol: sefazReturn.protocol,
        fiscalEmitDate: new Date(),
      },
    });

    throw new SefazException(
      sefazReturn.message || 'NFC-e rejeitada pela SEFAZ',
    );
  }

  private async generateDanfe(
    company: CompanyResponseDto,
    nfeData: NFeOptions,
    accessKey: string,
    signedXml: string,
    pdfPath: string,
  ): Promise<string> {
    const danfeConfig: DanfeConfig = {
      csc: company.nfceCsc,
      idCSC: company.nfceCscId,
      widthMM: 80,
    };

    const danfe = new DanfeGenerator(danfeConfig);
    const { totals, qrCodeUrl, urlChave } = danfe.parseXml(signedXml);

    await danfe.generateDanfe(
      nfeData,
      accessKey,
      totals,
      qrCodeUrl,
      urlChave,
      pdfPath,
    );

    return pdfPath;
  }

  private async updateSaleAsEmitted(
    saleId: number,
    accessKey: string,
    protocol?: string,
  ): Promise<void> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'EMITIDA',
        fiscalKey: accessKey,
        fiscalProtocol: protocol,
        fiscalEmitDate: new Date(),
      },
    });

    await this.companyService.incrementNfceNumber();
  }
}
