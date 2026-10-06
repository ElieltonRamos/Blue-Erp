import { Logger } from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import { join } from 'path';
import { CertificateException } from '../fiscal.exception';
import {
  DigitalCertificate,
  NFeConfiguration,
  SefazReturn,
} from '../entities/fiscal-module.entity';
import { CompanyResponseDto } from '../../../features/company/dto/company-response.dto';

export const SEFAZ_TEMP_DIR = join(process.cwd(), 'sefaz-temp');
export const DEBUG_RETENTION_DAYS = 7;

export function ensureSefazTempDir(): void {
  if (!existsSync(SEFAZ_TEMP_DIR)) {
    mkdirSync(SEFAZ_TEMP_DIR, { recursive: true });
  }
}

export function saveXmlDebug(
  logger: Logger,
  accessKey: string,
  xml: string,
  stage: string,
): void {
  try {
    ensureSefazTempDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${stage}_${accessKey || 'sem-chave'}_${timestamp}.xml`;
    writeFileSync(join(SEFAZ_TEMP_DIR, fileName), xml, 'utf8');
  } catch (error) {
    logger.warn(`Falha ao salvar XML de debug (${stage}): ${error}`);
  }
}

export function cleanOldDebugFiles(
  logger: Logger,
  retentionDays = DEBUG_RETENTION_DAYS,
): void {
  if (!existsSync(SEFAZ_TEMP_DIR)) return;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  for (const file of readdirSync(SEFAZ_TEMP_DIR)) {
    try {
      const filePath = join(SEFAZ_TEMP_DIR, file);
      const stats = statSync(filePath);
      if (stats.isFile() && stats.mtimeMs < cutoff) {
        unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Falha ao limpar XML de debug antigo (${file}): ${error}`);
    }
  }
}

export function buildSefazConfig(
  company: Pick<
    CompanyResponseDto,
    'state' | 'nfeEnvironment' | 'nfceEnvironment'
  >,
  model: '55' | '65',
): NFeConfiguration {
  return {
    environment:
      model === '55' ? company.nfeEnvironment : company.nfceEnvironment,
    state: company.state,
  };
}

/** Extrai a chave de 44 dígitos de `Id="NFe..."`. Retorna '' se não achar. */
export function extractAccessKey(xml: string): string {
  const match = xml.match(/Id="NFe(\d{44})"/);
  return match ? match[1] : '';
}

/** Modelo do documento (55 ou 65) a partir da chave de acesso (posições 20-21). */
export function modelFromAccessKey(accessKey: string): string {
  return accessKey.substring(20, 22);
}

/** Devolve o código se for um GTIN válido (8, 12, 13 ou 14 dígitos, dígito verificador correto). */
export function toGtin(code: string | null | undefined): string | undefined {
  const d = (code ?? '').trim();
  if (!/^\d+$/.test(d) || ![8, 12, 13, 14].includes(d.length)) return undefined;

  const sum = [...d.slice(0, -1)]
    .reverse()
    .reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10 === Number(d[d.length - 1]) ? d : undefined;
}

export async function loadCertificate(
  getCertificateBuffer: () => Promise<{ pfxBuffer: Buffer; password: string }>,
): Promise<DigitalCertificate> {
  try {
    const { pfxBuffer, password } = await getCertificateBuffer();
    return { pfxBuffer, password };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao carregar certificado digital';
    throw new CertificateException(message);
  }
}

export function validateCertificate(sender: {
  signer: { validateCertificate(): void };
}): void {
  try {
    sender.signer.validateCertificate();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Certificado inválido';
    throw new CertificateException(message);
  }
}

export function isAuthorized(sefazReturn: SefazReturn): boolean {
  return sefazReturn.success && sefazReturn.statusCode === '100';
}

// nfe-tax.ts
const BUYER_DEPENDENT = new Set(['101', '102']);
const SUBSTITUTO = new Set(['201', '202', '203']);

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const br = (n: number) => n.toFixed(2).replace('.', ',');

export function resolveCsosn(
  productCsosn: string | null | undefined,
  allowCredit: boolean,
): string {
  const base = (productCsosn ?? '').trim() || '102';

  if (SUBSTITUTO.has(base)) {
    throw new Error(
      `CSOSN ${base} (substituto tributário) exige dados de ST que o produto não tem.`,
    );
  }
  if (BUYER_DEPENDENT.has(base)) return allowCredit ? '101' : '102';
  return base; // 500, 103, 300, 400, 900 seguem o produto
}

/** Campos extras do ICMSSN101. `base` = valor do item (confirmar com o contador se considera desconto/frete). */
export function buildCreditIcms(base: number, rate: number) {
  return { pCredSN: rate, vCredICMSSN: round2((base * rate) / 100) };
}

export function creditInfoNote(rate: number, totalCredit: number): string {
  return `PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS NO VALOR DE R$ ${br(totalCredit)}; CORRESPONDENTE À ALÍQUOTA DE ${br(rate)}%, NOS TERMOS DO ART. 23 DA LEI COMPLEMENTAR Nº 123, DE 2006.`;
}
