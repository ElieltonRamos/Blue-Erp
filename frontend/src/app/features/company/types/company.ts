// interfaces/company.ts
export interface Company {
  id?: number;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  regimeTributario: '1' | '2' | '3';
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email?: string;
  nfceSerie: string;
  nfceNumeroAtual: number;
  nfceAmbiente: 'producao' | 'homologacao';
  nfceCsc: string;
  nfceIdCsc: string;  
  certificadoPath: string;
  certificadoSenha: string;
  certificadoDataExpiracao?: Date;
  ibptVersao: string
}
