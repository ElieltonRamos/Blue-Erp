import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PrismaService } from 'src/database/prisma.service';
import { nowBrasilia } from 'src/common/date-utils';
import { CompanyResponseDto } from 'src/features/company/dto/company-response.dto';
import { CompanyService } from '../../company/company.service';
import { SaleConverterNFeService } from '../../../sales/sale-converte-nfe.service';
import { StorageService } from './storage.service';
import { FiscalException, SefazException } from '../fiscal.exception';
import { EmissionResult, SefazReturn } from '../entities/fiscal-module.entity';
import { Nfe55Options } from '../entities/nfe.entity';
import { EmitNfeDto } from '../dto/emit-nfe.dto';
import { generateNFe55XML } from '../lib/xml/nfe-xml-builder';
import { NfeSender } from '../lib/transport/nfe-sender';
import { DanfeNfeGenerator } from '../lib/danfe/nfe-danfe-generator';
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

@Injectable()
export class EmissionNfeService {
  private readonly logger = new Logger(EmissionNfeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly storageService: StorageService,
    private readonly saleToNfeConverter: SaleConverterNFeService,
  ) {
    ensureSefazTempDir();
  }

  async emit(dto: EmitNfeDto): Promise<EmissionResult> {
    this.logger.log(`Iniciando emissão NF-e para venda ${dto.saleId}`);

    const sale = await this.findSale(dto.saleId);
    this.checkIfAlreadyEmitted(sale);

    const company = await this.companyService.getCompany();
    const certificate = await loadCertificate(() =>
      this.companyService.getCertificateBuffer(),
    );

    const nfeNumber = await this.reserveNfeNumber();

    let nfeData: Nfe55Options;
    let xml: string;
    let accessKey: string;
    let sender: NfeSender;
    try {
      nfeData = await this.saleToNfeConverter.convert(dto, nfeNumber);
      this.validateNfeData(nfeData);

      xml = generateNFe55XML(nfeData);
      accessKey = extractAccessKey(xml);
      if (!accessKey) {
        throw new FiscalException('Erro ao gerar chave de acesso');
      }

      cleanOldDebugFiles(this.logger);

      sender = new NfeSender(buildSefazConfig(company, '55'), certificate);
      validateCertificate(sender);
    } catch (error) {
      await this.releaseNfeNumber(nfeNumber);
      throw error;
    }

    const sefazReturn = await sender.sendNFe(xml);

    if (!isAuthorized(sefazReturn)) {
      await this.handleRejection(dto.saleId, accessKey, sefazReturn, nfeNumber);
    }

    if (!sefazReturn.signedXml) {
      this.logger.warn(`XML assinado não retornado para chave ${accessKey}`);
      throw new FiscalException('SEFAZ não retornou o XML assinado');
    }

    // A partir daqui a nota está autorizada na SEFAZ.
    // Qualquer falha é registrada com a chave para recuperação manual.
    const { nfeProcXml } = sefazReturn;
    const authorizedXml = nfeProcXml ?? sefazReturn.signedXml;
    if (!nfeProcXml) {
      this.logger.error(
        `Nota autorizada (${accessKey}) mas o nfeProc não foi montado (protNFe ausente). ` +
          `Gravando o XML assinado; DANFE não será gerado.`,
      );
    }

    saveXmlDebug(this.logger, accessKey, authorizedXml, 'autorizado');

    const storagePaths = this.storageService.getStoragePaths(
      accessKey,
      new Date(nfeData.ide.dhEmi),
    );

    try {
      await this.storageService.saveXml(storagePaths.xmlPath, authorizedXml);
    } catch (error) {
      this.logger.error(
        `Nota autorizada (${accessKey}) mas falha ao salvar XML: ${error}`,
      );
    }

    let pdfPath = '';
    if (dto.generateDanfe && storagePaths.pdfPath && nfeProcXml) {
      try {
        pdfPath = await this.generateDanfe(
          company,
          nfeProcXml,
          storagePaths.pdfPath,
        );
      } catch (error) {
        this.logger.error(
          `Nota autorizada (${accessKey}) mas falha ao gerar DANFE: ${error}`,
        );
      }
    }

    try {
      await this.updateSaleAsEmitted(
        dto.saleId,
        accessKey,
        authorizedXml,
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

    this.logger.log(`NF-e emitida com sucesso: ${accessKey}`);

    return {
      accessKey,
      protocol: sefazReturn.protocol,
      xmlPath: storagePaths.xmlPath,
      pdfPath,
      status: 'authorized',
      message: 'NF-e autorizada com sucesso',
    };
  }

  // Incremento atômico (update com increment); devolve o número reservado
  private async reserveNfeNumber(): Promise<number> {
    const { data } = await this.companyService.incrementNfeNumber();
    return data;
  }

  // Só reverte se ninguém avançou o número enquanto isso
  private async releaseNfeNumber(number: number): Promise<void> {
    try {
      await this.prisma.client.company.updateMany({
        where: { id: 1, nfeCurrentNumber: number },
        data: { nfeCurrentNumber: { decrement: 1 } },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao liberar número NF-e reservado (${number}): ${error}`,
      );
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
      throw new FiscalException(
        `Venda já possui nota fiscal emitida (chave: ${sale.fiscalKey})`,
        409,
      );
    }
  }

  private validateNfeData(nfeData: Nfe55Options): void {
    if (!nfeData.emit?.CNPJ) {
      throw new FiscalException('CNPJ do emitente é obrigatório');
    }
    if (!nfeData.produtos?.length) {
      throw new FiscalException('NF-e deve conter ao menos um produto');
    }
    if (!nfeData.pag?.detPag?.length) {
      throw new FiscalException('Informações de pagamento são obrigatórias');
    }
    if (!nfeData.ide?.nNF || !nfeData.ide?.serie) {
      throw new FiscalException('Número da nota e série são obrigatórios');
    }
  }

  private async handleRejection(
    saleId: number,
    accessKey: string,
    sefazReturn: SefazReturn,
    nfeNumber: number,
  ): Promise<never> {
    await this.releaseNfeNumber(nfeNumber);
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'ERRO',
        fiscalModel: '55',
        fiscalKey: accessKey,
        fiscalProtocol: sefazReturn.protocol,
        fiscalEmitDate: nowBrasilia(),
      },
    });

    throw new SefazException(
      sefazReturn.message || 'NF-e rejeitada pela SEFAZ',
    );
  }

  private async generateDanfe(
    company: CompanyResponseDto,
    nfeProcXml: string,
    pdfPath: string,
  ): Promise<string> {
    const danfe = new DanfeNfeGenerator({
      emitterEmail: company.email ?? undefined,
    });

    await fs.writeFile(pdfPath, await danfe.generate(nfeProcXml));

    return pdfPath;
  }

  private async updateSaleAsEmitted(
    saleId: number,
    accessKey: string,
    authorizedXml: string,
    protocol?: string,
  ): Promise<void> {
    await this.prisma.client.sale.update({
      where: { id: saleId },
      data: {
        fiscalStatus: 'EMITIDA',
        fiscalModel: '55',
        fiscalKey: accessKey,
        fiscalXml: authorizedXml,
        fiscalProtocol: protocol,
        fiscalEmitDate: nowBrasilia(),
      },
    });
  }
}
