import { Injectable, Logger } from '@nestjs/common';
import { CompanyService } from '../../company/company.service';
import { IbptService } from '../../../ibpt/ibpt.service';
import { StorageService } from './storage.service';
import { SaleConverterNFCeService } from '../../../sales/sale-converte-nfce.service';
import {
  NfceAlreadyEmittedException,
  SefazException,
  FiscalException,
} from '../fiscal.exception';
import {
  EmissionResult,
  NFeOptions,
  DanfeConfig,
  SefazReturn,
} from '../entities/fiscal-module.entity';
import { EmitNfceDto } from '../dto/emit-nfce.dto';
import { PrismaService } from 'src/database/prisma.service';
import { generateNFeXML } from '../lib/xml/nfce-xml-builder';
import { NfeSender } from '../lib/transport/nfe-sender';
import { DanfeGenerator } from '../lib/danfe/nfce-danfe-generator';
import {
  buildSefazConfig,
  cleanOldDebugFiles,
  ensureSefazTempDir,
  extractAccessKey,
  isAuthorized,
  loadCertificate,
  saveXmlDebug,
  validateCertificate,
} from '../lib/nfe-utils';
import { nowBrasilia } from 'src/common/date-utils';
import { CompanyResponseDto } from 'src/features/company/dto/company-response.dto';

@Injectable()
export class EmissionNfceService {
  private readonly logger = new Logger(EmissionNfceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly ibptService: IbptService,
    private readonly storageService: StorageService,
    private readonly saleToNfeConverter: SaleConverterNFCeService,
  ) {
    ensureSefazTempDir();
  }

  async emit(dto: EmitNfceDto): Promise<EmissionResult> {
    this.logger.log(`Iniciando emissão NFC-e para venda ${dto.saleId}`);

    const sale = await this.findSale(dto.saleId);
    this.checkIfAlreadyEmitted(sale);

    const company = await this.companyService.getCompany();
    const certificate = await loadCertificate(() =>
      this.companyService.getCertificateBuffer(),
    );

    await this.ibptService.updateAliqSale(dto.saleId);

    // Reserva o número atomicamente antes de qualquer processamento
    const nfceNumber = await this.reserveNfceNumber();

    let nfeData: NFeOptions;
    let xml: string;
    let accessKey: string;
    let sender: NfeSender;
    try {
      nfeData = await this.saleToNfeConverter.convert(dto.saleId, nfceNumber);
      this.validateNFeData(nfeData);

      xml = generateNFeXML(nfeData);
      accessKey = extractAccessKey(xml);
      if (!accessKey) {
        throw new FiscalException('Erro ao gerar chave de acesso');
      }
      this.validateInfAdic(nfeData, accessKey);

      cleanOldDebugFiles(this.logger);

      sender = new NfeSender(buildSefazConfig(company, '65'), certificate);
      validateCertificate(sender);
    } catch (error) {
      // Se falhar antes do SEFAZ, reverte o número reservado
      await this.releaseNfceNumber(nfceNumber);
      throw error;
    }

    const sefazReturn = await sender.send(xml, nfeData);

    if (!isAuthorized(sefazReturn)) {
      await this.handleRejection(
        dto.saleId,
        accessKey,
        sefazReturn,
        nfceNumber,
      );
    }

    if (!sefazReturn.signedXml) {
      this.logger.warn(`XML assinado não retornado para chave ${accessKey}`);
      throw new FiscalException('SEFAZ não retornou o XML assinado');
    }

    saveXmlDebug(this.logger, accessKey, sefazReturn.signedXml, 'retorno');

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

  // Incremento atômico (update com increment); devolve o número reservado
  private async reserveNfceNumber(): Promise<number> {
    const { data } = await this.companyService.incrementNfceNumber();
    return data;
  }

  // Reverte o número caso a emissão falhe antes de chegar ao SEFAZ.
  // Só reverte se ninguém avançou o número enquanto isso.
  private async releaseNfceNumber(number: number): Promise<void> {
    try {
      await this.prisma.client.company.updateMany({
        where: { id: 1, nfceCurrentNumber: number },
        data: { nfceCurrentNumber: { decrement: 1 } },
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

  private validateNFeData(nfeData: NFeOptions): void {
    if (!nfeData.emit?.CNPJ) {
      throw new FiscalException('CNPJ do emitente é obrigatório');
    }
    if (!nfeData.produtos || nfeData.produtos.length === 0) {
      throw new FiscalException('NFC-e deve conter ao menos um produto');
    }
    if (!nfeData.pag?.detPag || nfeData.pag.detPag.length === 0) {
      throw new FiscalException('Informações de pagamento são obrigatórias');
    }
    if (nfeData.pag.detPag.some((d) => !d.vPag || d.vPag <= 0)) {
      throw new FiscalException('Valor de pagamento inválido');
    }
    if (!nfeData.ide?.nNF || !nfeData.ide?.serie) {
      throw new FiscalException('Número da nota e série são obrigatórios');
    }
  }

  private async handleRejection(
    saleId: number,
    accessKey: string,
    sefazReturn: SefazReturn,
    nfceNumber: number,
  ): Promise<never> {
    await this.releaseNfceNumber(nfceNumber);
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'ERRO',
        fiscalModel: '65',
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
        fiscalModel: '65',
        fiscalKey: accessKey,
        fiscalXml: signedXml,
        fiscalProtocol: protocol,
        fiscalEmitDate: nowBrasilia(),
      },
    });
  }
}
