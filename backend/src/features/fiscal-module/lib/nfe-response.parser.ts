/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { SefazReturn } from '../entities/fiscal-module.entity';

const parseXML = promisify(parseString);

export class NfeResponseParser {
  async extractAndParse(responseXml: string): Promise<SefazReturn> {
    const parsed: any = await parseXML(responseXml);
    const body = this.extractSoapBody(parsed);

    if (!body) {
      throw new Error('Invalid SEFAZ SOAP response');
    }

    return this.parseResponse(body);
  }

  async extractAndParseCancellation(responseXml: string): Promise<SefazReturn> {
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

  async parseStatusResponse(
    responseXml: string,
  ): Promise<{ cStat: string; xMotivo: string }> {
    const parsed: any = await parseXML(responseXml);
    const body = this.extractSoapBody(parsed);
    const ret = body?.retConsStatServ || body;

    return {
      cStat: ret?.cStat?.[0] || ret?.cStat,
      xMotivo: ret?.xMotivo?.[0] || ret?.xMotivo,
    };
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

        if (!infProt && cStat === '100') {
          return {
            success: true,
            accessKey: chNFe,
            authorizationDate: dhRecbto,
            message: xMotivo || 'Autorizado',
            statusCode: cStat,
          };
        }

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
}
