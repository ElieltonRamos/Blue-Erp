export function calculateCheckDigit(key43: string): string {
  const multipliers = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  let idx = 0;
  for (let i = key43.length - 1; i >= 0; i--) {
    sum += parseInt(key43[i], 10) * multipliers[idx];
    idx = (idx + 1) % 8;
  }
  const remainder = sum % 11;
  return (remainder < 2 ? 0 : 11 - remainder).toString();
}

/** ISO -> 'YYYY-MM-DDTHH:mm:ss-03:00' */
export function formatDateTimeBR(isoDate: string): string {
  const date = new Date(isoDate);
  const local = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}-03:00`;
}

/** Chave de 44 dígitos. `dhEmiBR` deve ser o valor já formatado por formatDateTimeBR (AAMM sai dele). */
export function generateAccessKey(p: {
  cUF: string;
  dhEmiBR: string;
  cnpj: string;
  mod: string;
  serie: string;
  nNF: string;
  tpEmis: string;
  cNF: string;
}): string {
  const key43 =
    p.cUF.padStart(2, '0') +
    p.dhEmiBR.slice(2, 4) +
    p.dhEmiBR.slice(5, 7) +
    p.cnpj.replace(/\D/g, '').padStart(14, '0') +
    p.mod +
    p.serie.padStart(3, '0') +
    p.nNF.padStart(9, '0') +
    p.tpEmis +
    p.cNF.padStart(8, '0');
  return key43 + calculateCheckDigit(key43);
}
