/* eslint-disable no-unsafe-optional-chaining */
import * as soap from 'soap';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import * as https from 'https';
import {
  NFeConfiguration,
  DigitalCertificate,
  SefazReturn,
} from '../entities/fiscal-module.entity';
import { NfeSigner } from './nfe-signer';

const parseXML = promisify(parseString);

const WEBSERVICES: Record<string, { production: string; staging: string }> = {
  MG: {
    staging: 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
    production: 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
  },
  SVRS: {
    staging:
      'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx?wsdl',
    production:
      'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx?wsdl',
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
    this.certificate = certificate;
    this.signer = new NfeSigner(certificate);
  }

  async send(xml: string): Promise<SefazReturn> {
    try {
      this.signer.validateCertificate();
      const signedXml = this.signer.signXml(xml);
      const batchId = Date.now().toString();
      const batchXml = this.buildBatch(signedXml, batchId);
      const url = this.getWebserviceUrl();
      const result = await this.sendSoap(url, batchXml);

      return { ...result, signedXml };
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
      const url = this.getWebserviceUrl();
      const environment = this.config.environment === 'production' ? '1' : '2';

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${environment}</tpAmb>
  <xServ>CONSULTAR</xServ>
  <chNFe>${accessKey}</chNFe>
</consSitNFe>`;

      const agent = this.createHttpsAgent();
      const client = await soap.createClientAsync(url, {
        wsdl_options: { agent, timeout: 30000 },
      });

      const [result] = await client.nfeConsultaNFAsync({ nfeDadosMsg: xml });
      const parsed = await parseXML(result.nfeConsultaNFResult);

      return this.parseResponse(parsed);
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
      const url = this.getWebserviceUrl();
      const ufCode = UF_CODES[this.config.state.toUpperCase()] || '31';
      const environment = this.config.environment === 'production' ? '1' : '2';

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${environment}</tpAmb>
  <cUF>${ufCode}</cUF>
  <xServ>STATUS</xServ>
</consStatServ>`;

      const agent = this.createHttpsAgent();
      const client = await soap.createClientAsync(url, {
        wsdl_options: { agent, timeout: 30000 },
      });

      const [result] = await client.nfeStatusServicoNFAsync({
        nfeDadosMsg: xml,
      });
      const retStr =
        result.nfeStatusServicoNFResult || result.nfeStatusServicoResult;
      const parsed: any = await parseXML(retStr);

      const cStat =
        parsed.retConsStatServ?.cStat?.[0] || parsed.retConsStatServ?.cStat;
      const xMotivo =
        parsed.retConsStatServ?.xMotivo?.[0] || parsed.retConsStatServ?.xMotivo;

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
    return `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${batchId}</idLote>
  <indSinc>1</indSinc>
  ${xml}
</enviNFe>`;
  }

  private async sendSoap(url: string, batchXml: string): Promise<SefazReturn> {
    try {
      const agent = this.createHttpsAgent();

      const client = await soap.createClientAsync(url, {
        wsdl_options: { timeout: 30000, agent },
      });

      const args = { nfeDadosMsg: batchXml };

      let result;
      try {
        [result] = await client.nfeAutorizacaoLoteAsync(args);
      } catch {
        [result] =
          (await client.NFeAutorizacao4Async?.(args)) ||
          (await client.nfeAutorizacaoAsync?.(args));
      }

      const retXml =
        result.nfeAutorizacaoLoteResult ||
        result.NFeAutorizacao4Result ||
        result.nfeAutorizacaoResult;

      if (!retXml) {
        throw new Error('Invalid SEFAZ response');
      }

      const parsed = await parseXML(retXml);
      return this.parseResponse(parsed);
    } catch (error) {
      const err = error as Error;
      throw new Error(`SOAP communication error: ${err.message}`);
    }
  }

  private createHttpsAgent(): https.Agent {
    return new https.Agent({
      pfx: this.certificate.pfxBuffer,
      passphrase: this.certificate.password,
      rejectUnauthorized: true,
      keepAlive: true,
    });
  }

  private parseResponse(parsed: any): SefazReturn {
    try {
      const ret = parsed.retEnviNFe || parsed.nfeResultMsg;

      if (!ret) {
        throw new Error('Invalid response structure');
      }

      const cStat = ret.cStat?.[0] || ret.cStat;
      const xMotivo = ret.xMotivo?.[0] || ret.xMotivo;

      if (cStat === '100' || cStat === '104') {
        const protNFe = ret.protNFe?.[0]?.infProt?.[0];

        if (protNFe) {
          const protStatus = protNFe.cStat?.[0] || protNFe.cStat;

          if (protStatus === '100') {
            return {
              success: true,
              accessKey: protNFe.chNFe?.[0] || protNFe.chNFe,
              protocol: protNFe.nProt?.[0] || protNFe.nProt,
              authorizationDate: protNFe.dhRecbto?.[0] || protNFe.dhRecbto,
              message: protNFe.xMotivo?.[0] || protNFe.xMotivo || xMotivo,
              statusCode: protStatus,
              xmlProtocol: JSON.stringify(protNFe),
            };
          }

          return {
            success: false,
            message: protNFe.xMotivo?.[0] || protNFe.xMotivo || xMotivo,
            statusCode: protStatus,
            errors: [JSON.stringify(protNFe)],
          };
        }
      }

      return {
        success: false,
        message: xMotivo || 'Unknown error',
        statusCode: cStat || '999',
        errors: [JSON.stringify(parsed)],
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: 'Error parsing SEFAZ response',
        statusCode: '999',
        errors: [err.message, JSON.stringify(parsed)],
      };
    }
  }

  private getWebserviceUrl(): string {
    let uf = this.config.state.toUpperCase();

    if (SVRS_STATES.includes(uf)) {
      uf = 'SVRS';
    }

    const ws = WEBSERVICES[uf];
    if (!ws) {
      throw new Error(
        `Webservice not configured for state: ${this.config.state}`,
      );
    }

    return this.config.environment === 'production'
      ? ws.production
      : ws.staging;
  }
}
