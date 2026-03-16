export const UF_CODES: Record<string, string> = {
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

export const PAYMENT_MAP: Record<string, string> = {
  DINHEIRO: '01',
  CARTAO_CREDITO: '03',
  CARTAO_DEBITO: '04',
  PIX: '17',
  CREDITO_LOJA: '05',
};

export interface TaxSummary {
  totalValue: number;
  totalTax: number;
  federalTax: number;
  stateTax: number;
  municipalTax: number;
  federalPercent: number;
  statePercent: number;
  municipalPercent: number;
}
