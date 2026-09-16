// nfe-xml-parser.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import {
  ParsedNfeDto,
  ParsedNfeItemDto,
  ParsedNfeInstallmentDto,
} from './dto/parsed-nfe.dto';

@Injectable()
export class NfeXmlParserService {
  private readonly logger = new Logger(NfeXmlParserService.name);

  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  parse(xmlBuffer: Buffer): ParsedNfeDto {
    const start = Date.now();
    const json = this.parser.parse(xmlBuffer.toString('utf-8'));

    // aceita NFe autorizada (nfeProc > NFe > protNFe) ou NFe "crua" (só NFe)
    const nfe = json.nfeProc?.NFe ?? json.NFe;
    const infNFe = nfe?.infNFe;

    if (!infNFe) {
      throw new BadRequestException(
        'XML não é uma NFe válida (infNFe não encontrado)',
      );
    }

    const fiscalKey: string =
      json.nfeProc?.protNFe?.infProt?.chNFe ??
      (infNFe['@_Id'] as string)?.replace(/^NFe/, '');

    if (!fiscalKey) {
      throw new BadRequestException(
        'Não foi possível extrair a chave de acesso (chNFe) da NFe',
      );
    }

    const emit = infNFe.emit;
    if (!emit?.CNPJ) {
      throw new BadRequestException('CNPJ do emitente não encontrado no XML');
    }

    const detRaw = infNFe.det;
    const detList = Array.isArray(detRaw) ? detRaw : detRaw ? [detRaw] : [];

    if (detList.length === 0) {
      throw new BadRequestException('NFe sem itens (det)');
    }

    const items: ParsedNfeItemDto[] = detList.map((det: any) => {
      const prod = det.prod;
      if (
        !prod?.cProd ||
        prod.qCom === undefined ||
        prod.vUnCom === undefined
      ) {
        throw new BadRequestException(
          `Item da NFe com dados incompletos: ${JSON.stringify(prod)}`,
        );
      }
      return {
        supplierProductCode: String(prod.cProd),
        description: prod.xProd,
        ncm: prod.NCM,
        unit: prod.uCom,
        quantity: Number(prod.qCom),
        unitCost: Number(prod.vUnCom),
        total: Number(prod.vProd ?? prod.qCom * prod.vUnCom),
      };
    });

    const totalValue = Number(
      infNFe.total?.ICMSTot?.vNF ?? items.reduce((sum, i) => sum + i.total, 0),
    );

    const dupRaw = infNFe.cobr?.dup;
    const dupList = Array.isArray(dupRaw) ? dupRaw : dupRaw ? [dupRaw] : [];

    const installments: ParsedNfeInstallmentDto[] = dupList.map((dup: any) => ({
      number: String(dup.nDup),
      dueDate: dup.dVenc,
      value: Number(dup.vDup),
    }));

    const dest = infNFe.dest;
    if (!dest?.CNPJ) {
      throw new BadRequestException(
        'CNPJ do destinatário não encontrado no XML',
      );
    }

    const result: ParsedNfeDto = {
      supplierCnpj: emit.CNPJ,
      supplierName: emit.xNome,
      destCnpj: dest.CNPJ,
      invoiceNumber: String(infNFe.ide?.nNF ?? ''),
      fiscalKey,
      items,
      installments,
      totalValue,
    };

    this.logger.log(
      `[NFe ${fiscalKey}] parseada em ${Date.now() - start}ms | fornecedor=${result.supplierCnpj} | ${items.length} item(ns) | ${installments.length} parcela(s) | total=${totalValue}`,
    );

    return result;
  }
}
