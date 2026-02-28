export type ServiceType = 'authorization' | 'status' | 'query' | 'cancellation';
export type EnvironmentType = 'staging' | 'production';

export const WEBSERVICES: Record<
  string,
  Record<string, Record<ServiceType, string>>
> = {
  MG: {
    staging: {
      authorization: '/nfce/services/NFeAutorizacao4',
      status: '/nfce/services/NFeStatusServico4',
      query: '/nfce/services/NFeConsultaProtocolo4',
      cancellation: '/nfce/services/NFeRecepcaoEvento4',
    },
  },
  SVRS: {
    staging: {
      authorization: '/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      status: '/ws/NfeStatusServico/NFeStatusServico4.asmx',
      query: '/ws/NfeConsulta/NFeConsulta4.asmx',
      cancellation: '/ws/NfeRecepcaoEvento/NFeRecepcaoEvento4.asmx',
    },
  },
};

export const HOSTS: Record<string, Record<string, string>> = {
  MG: {
    staging: 'hnfce.fazenda.mg.gov.br',
  },
  SVRS: {
    staging: 'nfe-homologacao.svrs.rs.gov.br',
  },
};

export const baseUrl =
  'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml';

export const SVRS_STATES = [
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

export const SOAP_NAMESPACES: Record<string, string> = {
  nfeAutorizacaoLote: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
  nfeConsultaNF:
    'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4',
  nfeStatusServicoNF:
    'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4',
  nfeRecepcaoEvento:
    'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4',
};

export const PORTAL_URLS: Record<EnvironmentType, string> = {
  production: 'https://portalsped.fazenda.mg.gov.br/portalnfce',
  staging: 'https://hportalsped.fazenda.mg.gov.br/portalnfce',
};
