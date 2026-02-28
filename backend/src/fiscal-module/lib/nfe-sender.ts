/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as https from 'https';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import {
  NFeConfiguration,
  DigitalCertificate,
  SefazReturn,
  NFeOptions,
  CancelNFeParams,
} from '../entities/fiscal-module.entity';
import { NfeSigner } from './nfe-signer';
import { buildQrCodeUrl } from './nfe-xml-builder';
import { nowBrasilia, toSefazDateTime } from 'src/common/date-utils';

const parseXML = promisify(parseString);

const WEBSERVICES: Record<
  string,
  Record<
    string,
    {
      authorization: string;
      status: string;
      query: string;
      cancellation: string;
    }
  >
> = {
  MG: {
    staging: {
      authorization: '/nfce/services/NFeAutorizacao4',
      status: '/nfce/services/NFeStatusServico4',
      query: '/nfce/services/NFeConsultaProtocolo4',
      cancellation: '/nfce/services/NFeRecepcaoEvento4',
    },
  },
  SVRS: {
    staging: {
      authorization: '/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      status: '/ws/NfeStatusServico/NFeStatusServico4.asmx',
      query: '/ws/NfeConsulta/NFeConsulta4.asmx',
      cancellation: '/ws/NfeRecepcaoEvento/NFeRecepcaoEvento4.asmx',
    },
  },
};

const HOSTS: Record<string, Record<string, string>> = {
  MG: {
    staging: 'hnfce.fazenda.mg.gov.br',
  },
  SVRS: {
    staging: 'nfe-homologacao.svrs.rs.gov.br',
  },
};

const SVRS_STATES = [
  'AC',
  'AL',
  'AP',
  'DF',
  'ES',
  'PB',
  'RJ',
  'RN',
  'RO',
  'RR',
  'SC',
  'SE',
  'TO',
];

const UF_CODES: Record<string, string> = {
  AC: '12',
  AL: '27',
  AP: '16',
  AM: '13',
  BA: '29',
  CE: '23',
  DF: '53',
  ES: '32',
  GO: '52',
  MA: '21',
  MT: '51',
  MS: '50',
  MG: '31',
  PA: '15',
  PB: '25',
  PR: '41',
  PE: '26',
  PI: '22',
  RJ: '33',
  RN: '24',
  RS: '43',
  RO: '11',
  RR: '14',
  SC: '42',
  SP: '35',
  SE: '28',
  TO: '17',
};

export class NfeSender {
  private readonly config: NFeConfiguration;
  private readonly certificate: DigitalCertificate;
  public readonly signer: NfeSigner;

  constructor(config: NFeConfiguration, certificate: DigitalCertificate) {
    this.config = config;
    this.certificate = {
      ...certificate,
      pfxBuffer: Buffer.isBuffer(certificate.pfxBuffer)
        ? certificate.pfxBuffer
        : Buffer.from(certificate.pfxBuffer),
    };
    this.signer = new NfeSigner(this.certificate);
  }

  async send(xml: string, nfeData: NFeOptions): Promise<SefazReturn> {
    try {
      this.signer.validateCertificate();

      const signedXml = this.signer.signXml(xml);

      const accessKey = this.extractAccessKey(signedXml);
      if (!accessKey) {
        throw new Error('Access key not found');
      }

      const digValMatch = signedXml.match(
        /<Reference URI="#NFe\d{44}">[\s\S]*?<DigestValue>([^<]+)<\/DigestValue>/,
      );
      if (!digValMatch) {
        throw new Error('infNFe DigestValue not found');
      }

      const vNFMatch = signedXml.match(/<vNF>([^<]+)<\/vNF>/);
      if (!vNFMatch) {
        throw new Error('vNF not found in signed XML');
      }

      const qrCodeUrl = buildQrCodeUrl({
        accessKey,
        tpAmb: nfeData.ide.tpAmb,
        idCSC: nfeData.csc.idCSC,
        csc: nfeData.csc.csc,
      });

      const isProd = nfeData.ide.tpAmb === '1';
      const urlChaveConsulta = isProd
        ? 'https://portalsped.fazenda.mg.gov.br/portalnfce'
        : 'https://hportalsped.fazenda.mg.gov.br/portalnfce';

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
      const soapEnvelope = this.buildSoapEnvelope(
        'nfeAutorizacaoLote',
        batchXml,
      );

      const responseXml = await this.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeAutorizacaoLote',
      );

      const result = await this.extractAndParse(responseXml);
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
  private extractAccessKey(xml: string): string {
    const match = xml.match(/Id="NFe(\d{44})"/);
    return match ? match[1] : '';
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
      const soapEnvelope = this.buildSoapEnvelope('nfeConsultaNF', content);
      const responseXml = await this.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeConsultaNF',
      );

      return this.extractAndParse(responseXml);
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
      const soapEnvelope = this.buildSoapEnvelope(
        'nfeStatusServicoNF',
        content,
      );
      const responseXml = await this.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeStatusServicoNF',
      );

      const parsed: any = await parseXML(responseXml);
      const body = this.extractSoapBody(parsed);
      const ret = body?.retConsStatServ || body;

      const cStat = ret?.cStat?.[0] || ret?.cStat;
      const xMotivo = ret?.xMotivo?.[0] || ret?.xMotivo;

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

  private buildBatch(xml: string, batchId: string): string {
    return `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${batchId}</idLote>
  <indSinc>1</indSinc>
  ${xml}
</enviNFe>`;
  }

  private buildSoapEnvelope(action: string, content: string): string {
    const namespaceMap: Record<string, string> = {
      nfeAutorizacaoLote:
        'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
      nfeConsultaNF:
        'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4',
      nfeStatusServicoNF:
        'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4',
      nfeRecepcaoEvento:
        'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4',
    };

    const namespace =
      namespaceMap[action] ||
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4';

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="${namespace}">
  <soap12:Body>
    <nfe:nfeDadosMsg>${content}</nfe:nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
  }

  private postSoap(
    host: string,
    path: string,
    body: string,
    action: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: host,
        port: 443,
        path,
        method: 'POST',
        pfx: this.certificate.pfxBuffer,
        passphrase: this.certificate.password,
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(body, 'utf-8'),
          SOAPAction: action,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`),
            );
          } else {
            resolve(data);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(body);
      req.end();
    });
  }

  private async extractAndParse(responseXml: string): Promise<SefazReturn> {
    const parsed: any = await parseXML(responseXml);
    const body = this.extractSoapBody(parsed);

    if (!body) {
      throw new Error('Invalid SEFAZ SOAP response');
    }

    return this.parseResponse(body);
  }

  private extractSoapBody(parsed: any): any {
    const envelope =
      parsed?.['S:Envelope'] ||
      parsed?.['soap:Envelope'] ||
      parsed?.['soap12:Envelope'];

    if (!envelope) return parsed;

    const body =
      envelope['S:Body']?.[0] ||
      envelope['soap:Body']?.[0] ||
      envelope['soap12:Body']?.[0];

    if (!body) return parsed;

    const nfeResultMsg = body['nfeResultMsg']?.[0];
    if (!nfeResultMsg) return body;

    return (
      nfeResultMsg['retEnviNFe']?.[0] ||
      nfeResultMsg['retConsSitNFe']?.[0] ||
      nfeResultMsg['retConsStatServ']?.[0] ||
      nfeResultMsg
    );
  }

  private parseResponse(ret: any): SefazReturn {
    try {
      const cStat = ret?.cStat?.[0] || ret?.cStat;
      const xMotivo = ret?.xMotivo?.[0] || ret?.xMotivo;
      const chNFe = ret?.chNFe?.[0] || ret?.chNFe;
      const dhRecbto = ret?.dhRecbto?.[0] || ret?.dhRecbto;

      const protNFe = ret?.protNFe?.[0];
      const infProt = protNFe?.infProt?.[0];
      const protStatus = infProt?.cStat?.[0] || infProt?.cStat;
      const protMotivo = infProt?.xMotivo?.[0] || infProt?.xMotivo;
      const nProt = infProt?.nProt?.[0] || infProt?.nProt;
      const protChNFe = infProt?.chNFe?.[0] || infProt?.chNFe;
      const protDhRecbto = infProt?.dhRecbto?.[0] || infProt?.dhRecbto;

      // Autorizado — com ou sem protNFe
      if (cStat === '100' || cStat === '104') {
        if (infProt && protStatus === '100') {
          return {
            success: true,
            accessKey: protChNFe || chNFe,
            protocol: nProt,
            authorizationDate: protDhRecbto || dhRecbto,
            message: protMotivo || xMotivo || 'Autorizado',
            statusCode: protStatus,
            xmlProtocol: JSON.stringify(infProt),
          };
        }

        // cStat 100 no raiz sem protNFe (ex: status serviço)
        if (!infProt && cStat === '100') {
          return {
            success: true,
            accessKey: chNFe,
            authorizationDate: dhRecbto,
            message: xMotivo || 'Autorizado',
            statusCode: cStat,
          };
        }

        // protNFe presente mas rejeitado dentro do lote (cStat 104 com erro interno)
        if (infProt && protStatus !== '100') {
          return {
            success: false,
            message: protMotivo || xMotivo || 'Erro desconhecido',
            statusCode: protStatus,
            errors: [`cStat: ${protStatus} - ${protMotivo}`],
          };
        }
      }

      return {
        success: false,
        message: xMotivo || 'Erro desconhecido na SEFAZ',
        statusCode: cStat || '999',
        errors: [`cStat: ${cStat} - ${xMotivo}`],
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Erro ao processar resposta: ${err.message}`,
        statusCode: '999',
        errors: [err.stack || err.message],
      };
    }
  }

  private getEndpoint(
    service: 'authorization' | 'status' | 'query' | 'cancellation',
  ): {
    host: string;
    path: string;
  } {
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
      const soapEnvelope = this.buildSoapEnvelope('nfeRecepcaoEvento', content);

      const responseXml = await this.postSoap(
        host,
        path,
        soapEnvelope,
        'nfeRecepcaoEvento',
      );

      return this.extractAndParseCancellation(responseXml);
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

  private async extractAndParseCancellation(
    responseXml: string,
  ): Promise<SefazReturn> {
    const parsed: any = await parseXML(responseXml);

    const envelope =
      parsed?.['S:Envelope'] ||
      parsed?.['soap:Envelope'] ||
      parsed?.['soap12:Envelope'];

    const body =
      envelope?.['S:Body']?.[0] ||
      envelope?.['soap:Body']?.[0] ||
      envelope?.['soap12:Body']?.[0];

    const nfeResultMsg = body?.['nfeResultMsg']?.[0];
    const retEnvEvento = nfeResultMsg?.['retEnvEvento']?.[0];

    if (!retEnvEvento) {
      throw new Error('Resposta de cancelamento inválida da SEFAZ');
    }

    const cStat = retEnvEvento?.cStat?.[0];
    const xMotivo = retEnvEvento?.xMotivo?.[0];

    if (cStat === '128') {
      const retEvento = retEnvEvento?.retEvento?.[0];
      const infRetEvento = retEvento?.infEvento?.[0];
      const eventoCStat = infRetEvento?.cStat?.[0];
      const eventoXMotivo = infRetEvento?.xMotivo?.[0];
      const nProt = infRetEvento?.nProt?.[0];

      if (eventoCStat === '135') {
        return {
          success: true,
          protocol: nProt,
          message: eventoXMotivo || 'Cancelamento autorizado',
          statusCode: eventoCStat,
        };
      }

      return {
        success: false,
        message: eventoXMotivo || 'Cancelamento rejeitado',
        statusCode: eventoCStat || '999',
        errors: [`cStat: ${eventoCStat} - ${eventoXMotivo}`],
      };
    }

    return {
      success: false,
      message: xMotivo || 'Erro desconhecido no cancelamento',
      statusCode: cStat || '999',
      errors: [`cStat: ${cStat} - ${xMotivo}`],
    };
  }
}
