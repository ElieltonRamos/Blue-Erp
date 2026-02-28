import {
  NFeConfiguration,
  DigitalCertificate,
  SefazReturn,
  NFeOptions,
  CancelNFeParams,
} from '../entities/fiscal-module.entity';
import { NfeSigner } from './nfe-signer';
import { NfeHttpClient } from './nfe-http.client';
import { NfeResponseParser } from './nfe-response.parser';
import { buildQrCodeUrl } from './nfe-xml-builder';
import { nowBrasilia, toSefazDateTime } from 'src/common/date-utils';
import {
  HOSTS,
  WEBSERVICES,
  SVRS_STATES,
  UF_CODES,
  PORTAL_URLS,
  ServiceType,
} from './nfe-endpoints.config';

export class NfeSender {
  private readonly config: NFeConfiguration;
  private readonly certificate: DigitalCertificate;
  public readonly signer: NfeSigner;
  private readonly http: NfeHttpClient;
  private readonly parser: NfeResponseParser;

  constructor(config: NFeConfiguration, certificate: DigitalCertificate) {
    this.config = config;
    this.certificate = {
      ...certificate,
      pfxBuffer: Buffer.isBuffer(certificate.pfxBuffer)
        ? certificate.pfxBuffer
        : Buffer.from(certificate.pfxBuffer),
    };
    this.signer = new NfeSigner(this.certificate);
    this.http = new NfeHttpClient(this.certificate);
    this.parser = new NfeResponseParser();
  }

  async send(xml: string, nfeData: NFeOptions): Promise<SefazReturn> {
    try {
      this.signer.validateCertificate();

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
      });

      const isProd = nfeData.ide.tpAmb === '1';
      const urlChaveConsulta = isProd
        ? PORTAL_URLS.production
        : PORTAL_URLS.staging;

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
      const batchXml = this.buildBatch(finalXml, batchId);

      const { host, path } = this.getEndpoint('authorization');
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

      const result = await this.parser.extractAndParse(responseXml);
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

  async queryNFe(accessKey: string): Promise<SefazReturn> {
    try {
      const environment = this.config.environment === 'production' ? '1' : '2';

      const content = `<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${environment}</tpAmb>
  <xServ>CONSULTAR</xServ>
  <chNFe>${accessKey}</chNFe>
</consSitNFe>`;

      const { host, path } = this.getEndpoint('query');
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

      return this.parser.extractAndParse(responseXml);
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Error querying NF-e: ${err.message}`,
        statusCode: '999',
      };
    }
  }

  async queryStatus(): Promise<{
    online: boolean;
    message: string;
    time?: number;
  }> {
    const start = Date.now();

    try {
      const ufCode = UF_CODES[this.config.state.toUpperCase()] || '31';
      const environment = this.config.environment === 'production' ? '1' : '2';

      const content = `<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${environment}</tpAmb>
  <cUF>${ufCode}</cUF>
  <xServ>STATUS</xServ>
</consStatServ>`;

      const { host, path } = this.getEndpoint('status');
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

      const { cStat, xMotivo } =
        await this.parser.parseStatusResponse(responseXml);

      return {
        online: cStat === '107',
        message: xMotivo || 'Unknown status',
        time: Date.now() - start,
      };
    } catch (error) {
      const err = error as Error;
      return {
        online: false,
        message: `Error querying status: ${err.message}`,
        time: Date.now() - start,
      };
    }
  }

  async cancelNFe(params: CancelNFeParams): Promise<SefazReturn> {
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

      const { host, path } = this.getEndpoint('cancellation');
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

      return this.parser.extractAndParseCancellation(responseXml);
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

  private extractAccessKey(xml: string): string {
    const match = xml.match(/Id="NFe(\d{44})"/);
    return match ? match[1] : '';
  }

  private buildBatch(xml: string, batchId: string): string {
    return `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${batchId}</idLote>
  <indSinc>1</indSinc>
  ${xml}
</enviNFe>`;
  }

  private getEndpoint(service: ServiceType): { host: string; path: string } {
    let uf = this.config.state.toUpperCase();

    if (SVRS_STATES.includes(uf)) {
      uf = 'SVRS';
    }

    const env =
      this.config.environment === 'production' ? 'production' : 'staging';
    const host = HOSTS[uf]?.[env];
    const path = WEBSERVICES[uf]?.[env]?.[service];

    if (!host || !path) {
      throw new Error(
        `Webservice not configured for state: ${this.config.state}`,
      );
    }

    return { host, path };
  }
}
