export interface Cfop {
  code: string;
  title: string;
  natOp: string;
}

export const CFOPS: Cfop[] = [
  {
    code: '5101',
    title: 'Venda de produção do estabelecimento',
    natOp: 'Venda de produção do estabelecimento',
  },
  {
    code: '5102',
    title: 'Venda de mercadoria adquirida ou recebida de terceiros',
    natOp: 'Venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '6101',
    title: 'Venda de produção do estabelecimento',
    natOp: 'Venda de produção do estabelecimento',
  },
  {
    code: '6102',
    title: 'Venda de mercadoria adquirida ou recebida de terceiros',
    natOp: 'Venda de mercadoria adquirida ou recebida de terceiros',
  },
  {
    code: '5405',
    title:
      'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituído',
    natOp: 'Venda de mercadoria de terceiros sujeita a ST',
  },
];

export function findCfop(code: string | null | undefined): Cfop | undefined {
  const normalized = (code ?? '').replace(/\D/g, '');
  return CFOPS.find((c) => c.code === normalized);
}
