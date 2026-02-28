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
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import { join } from 'path';
import { nowBrasilia } from 'src/common/date-utils';

const DEBUG_RETENTION_DAYS = 7;

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

    // Reserva o número atomicamente antes de qualquer processamento
    const nfceNumber = await this.reserveNfceNumber();

    let nfeData: NFeOptions;
    try {
      nfeData = await this.saleToNfeConverter.convert(dto.saleId, nfceNumber);
    } catch (error) {
      // Se falhar antes do SEFAZ, reverte o número reservado
      await this.releaseNfceNumber(nfceNumber);
      throw error;
    }

    this.validateNFeData(nfeData);

    const xml = generateNFeXML(nfeData);
    const accessKey = this.extractAccessKey(xml);
    this.validateInfAdic(nfeData, accessKey);

    this.saveXmlDebug(accessKey, xml, 'envio');
    this.cleanOldDebugFiles();

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

    // A partir daqui a nota está autorizada na SEFAZ.
    // Qualquer falha é registrada com a chave para recuperação manual.
    const storagePaths = this.storageService.getStoragePaths(
      accessKey,
      new Date(nfeData.ide.dhEmi),
    );

    try {
      await this.storageService.saveXml(
        storagePaths.xmlPath,
        sefazReturn.signedXml,
      );
    } catch (error) {
      this.logger.error(
        `Nota autorizada (${accessKey}) mas falha ao salvar XML: ${error}`,
      );
    }

    let pdfPath = '';
    if (dto.generateDanfe && storagePaths.pdfPath) {
      try {
        pdfPath = await this.generateDanfe(
          company,
          nfeData,
          accessKey,
          sefazReturn.signedXml,
          storagePaths.pdfPath,
        );
      } catch (error) {
        this.logger.error(
          `Nota autorizada (${accessKey}) mas falha ao gerar DANFE: ${error}`,
        );
      }
    }

    // Persiste o status final — se falhar, loga com todos os dados para recuperação
    try {
      await this.updateSaleAsEmitted(
        dto.saleId,
        accessKey,
        sefazReturn.signedXml,
        sefazReturn.protocol,
      );
    } catch (error) {
      this.logger.error(
        `CRÍTICO: Nota autorizada pelo SEFAZ mas falha ao atualizar venda. ` +
          `Venda: ${dto.saleId} | Chave: ${accessKey} | Protocolo: ${sefazReturn.protocol} | Erro: ${error}`,
      );
      throw new FiscalException(
        `Nota fiscal autorizada (chave: ${accessKey}) mas houve falha ao registrar no sistema. ` +
          `Anote a chave e protocolo para regularização manual.`,
      );
    }

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

  // Incrementa atomicamente e retorna o número reservado
  private async reserveNfceNumber(): Promise<number> {
    const company = await this.prisma.client.$transaction(async (tx) => {
      const current = await tx.company.findUnique({ where: { id: 1 } });

      if (!current) {
        throw new FiscalException('Empresa não configurada');
      }

      const next = current.nfceCurrentNumber + 1;

      return tx.company.update({
        where: { id: 1 },
        data: { nfceCurrentNumber: next },
      });
    });

    return company.nfceCurrentNumber;
  }

  // Reverte o número caso a emissão falhe antes de chegar ao SEFAZ
  private async releaseNfceNumber(number: number): Promise<void> {
    try {
      await this.prisma.client.$transaction(async (tx) => {
        const current = await tx.company.findUnique({ where: { id: 1 } });

        // Só reverte se ninguém avançou o número enquanto isso
        if (current && current.nfceCurrentNumber === number) {
          await tx.company.update({
            where: { id: 1 },
            data: { nfceCurrentNumber: number - 1 },
          });
        }
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao liberar número NFC-e reservado (${number}): ${error}`,
      );
    }
  }

  private validateInfAdic(nfeData: NFeOptions, accessKey: string): void {
    const infCpl = nfeData.infAdic;

    if (!infCpl || infCpl.trim().length === 0) {
      throw new FiscalException(
        'Campo infAdic/infCpl não foi gerado. Emissão bloqueada para evitar multas fiscais.',
      );
    }

    const checks = [
      {
        pattern: /Tributos aproximados R\$\s[\d.,]+/,
        label: 'valor total de tributos',
      },
      { pattern: /federais/i, label: 'tributos federais' },
      { pattern: /estaduais/i, label: 'tributos estaduais' },
      { pattern: /municipais/i, label: 'tributos municipais' },
      { pattern: /IBPT/i, label: 'fonte IBPT' },
    ];

    const failures = checks
      .filter(({ pattern }) => !pattern.test(infCpl))
      .map(({ label }) => label);

    if (failures.length > 0) {
      this.logger.error(`infCpl inválido para chave ${accessKey}: ${infCpl}`);
      throw new FiscalException(
        `infAdic incompleto. Campos ausentes: ${failures.join(', ')}. Emissão bloqueada.`,
      );
    }

    this.logger.log(`infAdic validado com sucesso para chave ${accessKey}`);
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

  private cleanOldDebugFiles(): void {
    try {
      const cutoff = Date.now() - DEBUG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const files = readdirSync(this.sefazTempDir);

      for (const file of files) {
        const filePath = join(this.sefazTempDir, file);
        const { mtimeMs } = statSync(filePath);
        if (mtimeMs < cutoff) {
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      this.logger.warn(`Falha ao limpar XMLs de debug antigos: ${error}`);
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
        fiscalEmitDate: nowBrasilia(),
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
    signedXml: string,
    protocol?: string,
  ): Promise<void> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'EMITIDA',
        fiscalKey: accessKey,
        fiscalXml: signedXml,
        fiscalProtocol: protocol,
        fiscalEmitDate: nowBrasilia(),
      },
    });
  }
}
