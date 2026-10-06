import {
  NFeConfiguration,
  DigitalCertificate,
  SefazReturn,
  NFeOptions,
  CancelNFeParams,
} from '../../entities/fiscal-module.entity';
import { NfeSigner } from './nfe-signer';
import { NfeHttpClient } from './nfe-http.client';
import { NfeResponseParser } from './nfe-response.parser';
import { nowBrasilia, toSefazDateTime } from 'src/common/date-utils';
import {
  HOSTS_BY_MODEL,
  WEBSERVICES_BY_MODEL,
  SVRS_STATES_BY_MODEL,
  UF_CODES,
  ServiceType,
  NfeModel,
  CHAVE_CONSULTA_URLS,
} from './nfe-endpoints.config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { buildQrCodeUrl } from '../xml/nfce-xml-builder';

export type NfeSendResult = SefazReturn & { nfeProcXml?: string };

export class NfeSender {
  private readonly config: NFeConfiguration;
  private readonly certificate: DigitalCertificate;
  public readonly signer: NfeSigner;
  private readonly http: NfeHttpClient;
  private readonly parser: NfeResponseParser;
  private readonly logger = new Logger(NfeSender.name);
  private readonly sefazTempDir = join(process.cwd(), 'sefaz-temp');

  constructor(config: NFeConfiguration, certificate: DigitalCertificate) {
    this.config = config;
    this.certificate = {
      ...certificate,
      pfxBuffer: Buffer.isBuffer(certificate.pfxBuffer)
        ? certificate.pfxBuffer
        : Buffer.from(certificate.pfxBuffer),
    };
    this.signer = new NfeSigner(this.certificate);
    this.http = new NfeHttpClient({
      key: this.signer.getKeyPem(),
      cert: this.signer.getCertPem(),
    });
    this.parser = new NfeResponseParser();
  }

  // ===== NFC-e (modelo 65) =====
  async send(xml: string, nfeData: NFeOptions): Promise<SefazReturn> {
    try {
      this.signer.validateCertificate();
      this.assertEnvironment(String(nfeData.ide.tpAmb));

      const signedXml = this.signer.signXml(xml);

      const accessKey = this.extractAccessKey(signedXml);
      if (!accessKey) throw new Error('Access key not found');

      const digValMatch = signedXml.match(
        /<Reference URI="#NFe\d{44}">[\s\S]*?<DigestValue>([^<]+)<\/DigestValue>/,
      );
      if (!digValMatch) throw new Error('infNFe DigestValue not found');

      const vNFMatch = signedXml.match(/<vNF>([^<]+)<\/vNF>/);
      if (!vNFMatch) throw new Error('vNF not found in signed XML');

      const qrCodeUrl = buildQrCodeUrl({
        accessKey,
        tpAmb: nfeData.ide.tpAmb,
        idCSC: nfeData.csc.idCSC,
        csc: nfeData.csc.csc,
        uf: this.config.state,
      });

      const isProd = nfeData.ide.tpAmb === '1';
      const uf = this.config.state.toUpperCase();
      const urlChaveConsulta =
        CHAVE_CONSULTA_URLS[uf]?.[isProd ? 'production' : 'staging'];

      const infNFeSupl =
        `<infNFeSupl>` +
        `<qrCode><![CDATA[${qrCodeUrl}]]></qrCode>` +
        `<urlChave>${urlChaveConsulta}</urlChave>` +
        `</infNFeSupl>`;

      const finalXml = signedXml.replace('</infNFe>', `</infNFe>${infNFeSupl}`);

      if (!finalXml.includes('<infNFeSupl>')) {
        throw new Error('Failed to inject infNFeSupl into signed XML');
      }

      const batchId = Date.now().toString();
      this.saveXmlDebug(accessKey, finalXml, 'envio');
      const batchXml = this.buildBatch(finalXml, batchId);

      const { host, path } = this.getEndpoint('authorization', '65');
      this.logger.log(
        `Enviando autorização ${accessKey} para ${host}${path} (state=${this.config.state}, env=${this.config.environment})`,
      );

      const soapEnvelope = this.http.buildSoapEnvelope(
        'nfeAutorizacaoLote',
        batchXml,
      );
      const responseXml = await this.http.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeAutorizacaoLote',
      );

      this.logger.debug(`SEFAZ raw response (${accessKey}): ${responseXml}`);

      const result = await this.parser.extractAndParse(responseXml);

      this.logger.log(
        `Autorização ${accessKey}: success=${result.success} statusCode=${result.statusCode} message=${result.message}`,
      );

      return { ...result, signedXml: finalXml };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: err.message,
        statusCode: '999',
        errors: [err.stack || err.message],
      };
    }
  }

  // ===== NF-e (modelo 55) =====
  async sendNFe(xml: string): Promise<NfeSendResult> {
    try {
      this.signer.validateCertificate();

      const modMatch = xml.match(/<mod>(\d+)<\/mod>/);
      if (modMatch?.[1] !== '55') {
        throw new Error(
          `Modelo inválido: esperado 55, recebido ${modMatch?.[1] ?? 'ausente'}`,
        );
      }

      const tpAmbMatch = xml.match(/<tpAmb>(\d)<\/tpAmb>/);
      if (!tpAmbMatch) throw new Error('tpAmb not found in XML');
      this.assertEnvironment(tpAmbMatch[1]);

      const signedXml = this.stripXmlDeclaration(this.signer.signXml(xml));

      const accessKey = this.extractAccessKey(signedXml);
      if (!accessKey) throw new Error('Access key not found');

      const batchId = Date.now().toString();
      this.saveXmlDebug(accessKey, signedXml, 'envio');
      const batchXml = this.buildBatch(signedXml, batchId);

      const { host, path } = this.getEndpoint('authorization', '55');
      this.logger.log(
        `Enviando autorização NF-e ${accessKey} para ${host}${path} (state=${this.config.state}, env=${this.config.environment})`,
      );

      const soapEnvelope = this.http.buildSoapEnvelope(
        'nfeAutorizacaoLote',
        batchXml,
      );
      const responseXml = await this.http.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeAutorizacaoLote',
      );

      this.logger.debug(`SEFAZ raw response (${accessKey}): ${responseXml}`);
      this.saveXmlDebug(accessKey, responseXml, 'retorno');

      const result = await this.parser.extractAndParse(responseXml);

      this.logger.log(
        `Autorização NF-e ${accessKey}: success=${result.success} statusCode=${result.statusCode} message=${result.message}`,
      );

      let nfeProcXml: string | undefined;

      if (result.success) {
        const protNFeMatch = responseXml.match(
          /<protNFe[\s>][\s\S]*?<\/protNFe>/,
        );

        if (protNFeMatch) {
          nfeProcXml =
            `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
            signedXml +
            protNFeMatch[0] +
            `</nfeProc>`;
        } else {
          this.logger.error(
            `protNFe não encontrado na resposta autorizada (${accessKey})`,
          );
        }
      }

      return { ...result, signedXml, nfeProcXml };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: err.message,
        statusCode: '999',
        errors: [err.stack || err.message],
      };
    }
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

  async queryNFe(
    accessKey: string,
    model: NfeModel = '65',
  ): Promise<SefazReturn> {
    try {
      const environment = this.config.environment === 'production' ? '1' : '2';

      const content = `<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${environment}</tpAmb>
  <xServ>CONSULTAR</xServ>
  <chNFe>${accessKey}</chNFe>
</consSitNFe>`;

      const { host, path } = this.getEndpoint('query', model);
      this.logger.debug(`Consultando ${accessKey} em ${host}${path}`);

      const soapEnvelope = this.http.buildSoapEnvelope(
        'nfeConsultaNF',
        content,
      );
      const responseXml = await this.http.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeConsultaNF',
      );

      this.logger.debug(
        `SEFAZ raw response (consulta ${accessKey}): ${responseXml}`,
      );

      return this.parser.extractAndParse(responseXml);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao consultar ${accessKey}: ${err.message}`);
      return {
        success: false,
        message: `Error querying NF-e: ${err.message}`,
        statusCode: '999',
      };
    }
  }

  async queryStatus(model: NfeModel = '65'): Promise<{
    online: boolean;
    message: string;
    time?: number;
  }> {
    const start = Date.now();

    try {
      const ufCode = UF_CODES[this.config.state.toUpperCase()] || '31';
      const environment = this.config.environment === 'production' ? '1' : '2';

      const content = `<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${environment}</tpAmb><cUF>${ufCode}</cUF><xServ>STATUS</xServ></consStatServ>`;

      const { host, path } = this.getEndpoint('status', model);
      const soapEnvelope = this.http.buildSoapEnvelope(
        'nfeStatusServicoNF',
        content,
      );
      const responseXml = await this.http.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeStatusServicoNF',
      );

      this.logger.debug(`SEFAZ raw response (status): ${responseXml}`);

      const { cStat, xMotivo } =
        await this.parser.parseStatusResponse(responseXml);

      return {
        online: cStat === '107',
        message: xMotivo || 'Unknown status',
        time: Date.now() - start,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Erro ao consultar status SEFAZ: ${err.message}`,
        err.stack,
      );
      return {
        online: false,
        message: `Error querying status: ${err.message}`,
        time: Date.now() - start,
      };
    }
  }

  async cancelNFe(
    params: CancelNFeParams,
    model: NfeModel = '65',
  ): Promise<SefazReturn> {
    try {
      const { accessKey, protocol, justification, cnpj } = params;
      const environment = this.config.environment === 'production' ? '1' : '2';

      const cOrgao = accessKey.substring(0, 2);
      const nSeqEvento = '1';
      const eventId = `ID110111${accessKey}${nSeqEvento.padStart(2, '0')}`;
      const dhEvento = toSefazDateTime(nowBrasilia());

      const infEvento =
        `<infEvento Id="${eventId}">` +
        `<cOrgao>${cOrgao}</cOrgao>` +
        `<tpAmb>${environment}</tpAmb>` +
        `<CNPJ>${cnpj.replace(/\D/g, '')}</CNPJ>` +
        `<chNFe>${accessKey}</chNFe>` +
        `<dhEvento>${dhEvento}</dhEvento>` +
        `<tpEvento>110111</tpEvento>` +
        `<nSeqEvento>${nSeqEvento}</nSeqEvento>` +
        `<verEvento>1.00</verEvento>` +
        `<detEvento versao="1.00">` +
        `<descEvento>Cancelamento</descEvento>` +
        `<nProt>${protocol}</nProt>` +
        `<xJust>${justification}</xJust>` +
        `</detEvento>` +
        `</infEvento>`;

      const eventoXml =
        `<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">` +
        infEvento +
        `</evento>`;

      const signedEvento = this.signer.signXmlById(eventoXml, eventId);

      const content =
        `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">` +
        `<idLote>${Date.now()}</idLote>` +
        signedEvento +
        `</envEvento>`;

      const { host, path } = this.getEndpoint('cancellation', model);
      this.logger.log(`Enviando cancelamento ${accessKey} para ${host}${path}`);

      const soapEnvelope = this.http.buildSoapEnvelope(
        'nfeRecepcaoEvento',
        content,
      );
      const responseXml = await this.http.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeRecepcaoEvento',
      );

      this.logger.debug(
        `SEFAZ raw response (cancelamento ${accessKey}): ${responseXml}`,
      );

      const result = await this.parser.extractAndParseCancellation(responseXml);

      this.logger.log(
        `Cancelamento ${accessKey}: success=${result.success} statusCode=${result.statusCode} message=${result.message}`,
      );

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Erro ao cancelar: ${err.message}`);
      return {
        success: false,
        message: err.message,
        statusCode: '999',
        errors: [err.stack || err.message],
      };
    }
  }

  private assertEnvironment(tpAmb: string): void {
    const expected = this.config.environment === 'production' ? '1' : '2';
    if (tpAmb !== expected) {
      throw new Error(
        `tpAmb do XML (${tpAmb}) diverge de config.environment (${this.config.environment})`,
      );
    }
  }

  private stripXmlDeclaration(xml: string): string {
    return xml.replace(/<\?xml[^>]*\?>\s*/, '');
  }

  private extractAccessKey(xml: string): string {
    const match = xml.match(/Id="NFe(\d{44})"/);
    return match ? match[1] : '';
  }

  private buildBatch(xml: string, batchId: string): string {
    return `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${batchId}</idLote><indSinc>1</indSinc>${xml}</enviNFe>`;
  }

  private getEndpoint(
    service: ServiceType,
    model: NfeModel = '65',
  ): { host: string; path: string } {
    const originalUf = this.config.state.toUpperCase();
    let uf = originalUf;

    if (SVRS_STATES_BY_MODEL[model].includes(uf)) {
      uf = 'SVRS';
    }

    const env =
      this.config.environment === 'production' ? 'production' : 'staging';
    const host = HOSTS_BY_MODEL[model][uf]?.[env];
    const path = WEBSERVICES_BY_MODEL[model][uf]?.[env]?.[service];

    this.logger.debug(
      `getEndpoint(${service}, model=${model}): state=${originalUf} -> uf=${uf} env=${env} host=${host} path=${path}`,
    );

    if (!host || !path) {
      this.logger.error(
        `Webservice não configurado: model=${model} state=${originalUf} uf=${uf} env=${env} service=${service}`,
      );
      throw new Error(
        `Webservice not configured for model ${model}, state: ${this.config.state}`,
      );
    }

    return { host, path };
  }
}
