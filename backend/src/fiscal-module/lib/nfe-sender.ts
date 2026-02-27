import * as https from 'https';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  NFeConfiguration,
  DigitalCertificate,
  SefazReturn,
  NFeOptions,
} from '../entities/fiscal-module.entity';
import { NfeSigner } from './nfe-signer';
import { buildQrCodeUrl } from './nfe-xml-builder';

const parseXML = promisify(parseString);

const WEBSERVICES: Record<
  string,
  Record<string, { authorization: string; status: string; query: string }>
> = {
  MG: {
    staging: {
      authorization: '/nfce/services/NFeAutorizacao4',
      status: '/nfce/services/NFeStatusServico4',
      query: '/nfce/services/NFeConsultaProtocolo4',
    },
  },
  SVRS: {
    staging: {
      authorization: '/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      status: '/ws/NfeStatusServico/NFeStatusServico4.asmx',
      query: '/ws/NfeConsulta/NFeConsulta4.asmx',
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

      // 1️⃣ Assina o XML
      const signedXml = this.signer.signXml(xml);

      // 2️⃣ Extrai a chave de acesso
      const accessKey = this.extractAccessKey(signedXml);
      if (!accessKey) {
        throw new Error('Access key not found');
      }

      // 3️⃣ Extrai o DigestValue CORRETO (do infNFe)
      const digValMatch = signedXml.match(
        /<Reference URI="#NFe\d{44}">[\s\S]*?<DigestValue>([^<]+)<\/DigestValue>/,
      );
      if (!digValMatch) {
        throw new Error('infNFe DigestValue not found');
      }
      const digVal = digValMatch[1];

      // 4️⃣ Calcula valor total da nota e do ICMS
      // Importante: No seu XML anterior o vICMS era 0.00
      const vNF = nfeData.produtos
        .reduce((s, p) => s + p.qCom * p.vUnCom, 0)
        .toFixed(2);

      // Se o seu sistema não calcula ICMS (Simples Nacional), manteremos 0.00
      // const vICMS = '0.00';

      // 5️⃣ Gera QR Code (Usando a função buildQrCodeUrl atualizada com vICMS)
      const qrCodeUrl = buildQrCodeUrl({
        accessKey,
        tpAmb: nfeData.ide.tpAmb,
        dhEmi: nfeData.ide.dhEmi,
        vNF,
        digVal,
        idCSC: nfeData.csc.idCSC,
        csc: nfeData.csc.csc,
      });

      // 6️⃣ URLs de Consulta Manual (Conforme tabela oficial Portal Sped)
      const isProd = nfeData.ide.tpAmb === '1';
      const urlChaveConsulta = isProd
        ? 'https://portalsped.fazenda.mg.gov.br/portalnfce'
        : 'https://hportalsped.fazenda.mg.gov.br/portalnfce';

      // 7️⃣ Monta infNFeSupl
      const infNFeSupl =
        `<infNFeSupl>` +
        `<qrCode><![CDATA[${qrCodeUrl}]]></qrCode>` +
        `<urlChave>${urlChaveConsulta}</urlChave>` +
        `</infNFeSupl>`;

      // 8️⃣ Injeta infNFeSupl NO LUGAR CORRETO
      // Dica: Para NFC-e, o infNFeSupl deve vir após o infNFe e ANTES da Signature.
      const finalXml = signedXml.replace('</infNFe>', `</infNFe>${infNFeSupl}`);

      // 9️⃣ Monta lote
      const batchId = Date.now().toString();
      const batchXml = this.buildBatch(finalXml, batchId);

      // 🔟 Salva XML (debug)
      const dirPath = join(process.cwd(), 'xml');
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      writeFileSync(join(dirPath, 'NFe-homolog.xml'), finalXml, 'utf8');

      // 1️⃣1️⃣ Envia para SEFAZ
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
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
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
          console.log('=== SEFAZ RAW RESPONSE ===');
          console.log('Status:', res.statusCode);
          console.log('Body:', data);
          console.log('========================');

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

    const retEnviNFe = nfeResultMsg['retEnviNFe']?.[0];

    return retEnviNFe || nfeResultMsg;
  }

  private parseResponse(ret: any): SefazReturn {
    try {
      const cStat = ret?.cStat?.[0] || ret?.cStat;
      const xMotivo = ret?.xMotivo?.[0] || ret?.xMotivo;

      if (cStat === '104') {
        const protNFe = ret?.protNFe?.[0];
        const infProt = protNFe?.infProt?.[0];

        if (infProt) {
          const protStatus = infProt.cStat?.[0];
          const protMotivo = infProt.xMotivo?.[0];

          if (protStatus === '100') {
            return {
              success: true,
              accessKey: infProt.chNFe?.[0],
              protocol: infProt.nProt?.[0],
              authorizationDate: infProt.dhRecbto?.[0],
              message: protMotivo || 'Autorizado',
              statusCode: protStatus,
              xmlProtocol: JSON.stringify(infProt),
            };
          }

          return {
            success: false,
            message: protMotivo || xMotivo || 'Erro desconhecido',
            statusCode: protStatus,
            errors: [`cStat: ${protStatus} - ${protMotivo}`],
          };
        }
      }

      if (cStat === '100') {
        return {
          success: true,
          message: xMotivo || 'Autorizado',
          statusCode: cStat,
        };
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

  private getEndpoint(service: 'authorization' | 'status' | 'query'): {
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

  private createHttpsAgent(): https.Agent {
    return new https.Agent({
      pfx: this.certificate.pfxBuffer,
      passphrase: this.certificate.password,
      rejectUnauthorized: false,
      keepAlive: true,
      minVersion: 'TLSv1.2',
    });
  }
}
