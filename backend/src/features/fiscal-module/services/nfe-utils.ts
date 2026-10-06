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
  SefazReturn,
} from '../entities/fiscal-module.entity';

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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${stage}_${accessKey}_${timestamp}.xml`;
    writeFileSync(join(SEFAZ_TEMP_DIR, fileName), xml, 'utf8');
  } catch (error) {
    logger.warn(`Falha ao salvar XML de debug (${stage}): ${error}`);
  }
}

export function cleanOldDebugFiles(
  logger: Logger,
  retentionDays = DEBUG_RETENTION_DAYS,
): void {
  try {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    for (const file of readdirSync(SEFAZ_TEMP_DIR)) {
      const filePath = join(SEFAZ_TEMP_DIR, file);
      if (statSync(filePath).mtimeMs < cutoff) {
        unlinkSync(filePath);
      }
    }
  } catch (error) {
    logger.warn(`Falha ao limpar XMLs de debug antigos: ${error}`);
  }
}

/** Extrai a chave de 44 dígitos de `Id="NFe..."`. Retorna '' se não achar. */
export function extractAccessKey(xml: string): string {
  const match = xml.match(/Id="NFe(\d{44})"/);
  return match ? match[1] : '';
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
