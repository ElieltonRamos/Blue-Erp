export type ServiceType =
  | 'authorization'
  | 'status'
  | 'query'
  | 'cancellation'
  | 'returnAuthorization'
  | 'inutilization'
  | 'registrationQuery';
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
      returnAuthorization: '', // preencher se disponível para MG
      inutilization: '', // preencher se disponível para MG
      registrationQuery: '', // preencher se disponível para MG
    },
  },
  SVRS: {
    staging: {
      authorization: '/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      status: '/ws/NfeStatusServico/NFeStatusServico4.asmx',
      query: '/ws/NfeConsulta/NfeConsulta4.asmx',
      cancellation: '/ws/recepcaoevento/recepcaoevento4.asmx',
      returnAuthorization: '/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      inutilization: '/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      registrationQuery: '/ws/cadconsultacadastro/cadconsultacadastro2.asmx',
    },
    production: {
      authorization: '/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      status: '/ws/NfeStatusServico/NFeStatusServico4.asmx',
      query: '/ws/NfeConsulta/NfeConsulta4.asmx',
      cancellation: '/ws/recepcaoevento/recepcaoevento4.asmx',
      returnAuthorization: '/ws/NFeRetAutorizacao/NFeRetAutorizacao4.asmx',
      inutilization: '/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
      registrationQuery: '/ws/cadconsultacadastro/cadconsultacadastro2.asmx',
    },
  },
};

export const HOSTS: Record<string, Record<string, string>> = {
  MG: {
    staging: 'hnfce.fazenda.mg.gov.br',
  },
  SVRS: {
    staging: 'nfce-homologacao.svrs.rs.gov.br',
    production: 'nfce.svrs.rs.gov.br',
  },
};

export const CHAVE_CONSULTA_URLS: Record<
  string,
  Record<EnvironmentType, string>
> = {
  BA: {
    production: 'http://www.sefaz.ba.gov.br/nfce/consulta',
    staging: 'http://hinternet.sefaz.ba.gov.br/nfce/consulta',
  },
};

export const SVRS_STATES = [
  'AC',
  'AL',
  'AP',
  'BA',
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

// export const baseUrl =
//   'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml';
// export const baseUrl = 'http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx';
// esses endpoints podem ser uteis ainda

// Fonte: https://nfce.encat.org/desenvolvedor/qrcode/ (consultado em 03/09/2026)
// URLs por UF utilizadas na montagem do QR Code (tag qrCode do DANFE NFC-e).
export const PORTAL_URLS: Record<string, Record<EnvironmentType, string>> = {
  AC: {
    production: 'http://www.sefaznet.ac.gov.br/nfce/qrcode?',
    staging: 'http://www.hml.sefaznet.ac.gov.br/nfce/qrcode?',
  },
  AL: {
    production: 'http://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',
    staging: 'http://nfce.sefaz.al.gov.br/QRCode/consultarNFCe.jsp',
  },
  AP: {
    production: 'https://www.sefaz.ap.gov.br/nfce/nfcep.php',
    staging: 'https://www.sefaz.ap.gov.br/nfcehml/nfce.php',
  },
  AM: {
    production: 'sistemas.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp',
    staging: 'homnfce.sefaz.am.gov.br/nfceweb/consultarNFCe.jsp',
  },
  BA: {
    production: 'http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',
    staging: 'http://hnfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx',
  },
  CE: {
    production: 'http://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html?',
    staging: 'http://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html?',
  },
  DF: {
    production: 'http://www.fazenda.df.gov.br/nfce/qrcode?',
    staging: 'http://www.fazenda.df.gov.br/nfce/qrcode?',
  },
  ES: {
    production: 'http://app.sefaz.es.gov.br/ConsultaNFCe/',
    staging: 'http://homologacao.sefaz.es.gov.br/ConsultaNFCe/',
  },
  GO: {
    production: 'https://nfeweb.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',
    staging:
      'https://nfewebhomolog.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe',
  },
  MA: {
    production: 'nfce.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
    staging: 'homologacao.sefaz.ma.gov.br/portal/consultarNFCe.jsp',
  },
  MT: {
    production: 'http://www.sefaz.mt.gov.br/nfce/consultanfce',
    staging: 'http://homologacao.sefaz.mt.gov.br/nfce/consultanfce',
  },
  MS: {
    production: 'http://www.dfe.ms.gov.br/nfce/qrcode?',
    staging: 'http://www.dfe.ms.gov.br/nfce/qrcode?',
  },
  MG: {
    production:
      'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
    staging:
      'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
  },
  PA: {
    production:
      'https://appnfc.sefa.pa.gov.br/portal/view/consultas/nfce/nfceForm.seam',
    staging:
      'https://appnfc.sefa.pa.gov.br/portal-homologacao/view/consultas/nfce/nfceForm.seam',
  },
  PB: {
    production: 'http://www.sefaz.pb.gov.br/nfce',
    staging: 'http://www.sefaz.pb.gov.br/nfcehom',
  },
  PR: {
    production: 'http://www.fazenda.pr.gov.br/nfce/qrcode?',
    staging: 'http://www.fazenda.pr.gov.br/nfce/qrcode?',
  },
  PE: {
    production: 'http://nfce.sefaz.pe.gov.br/nfce/consulta',
    staging: 'http://nfcehomolog.sefaz.pe.gov.br/nfce/consulta',
  },
  PI: {
    production: 'http://www.sefaz.pi.gov.br/nfce/qrcode',
    staging: 'http://www.sefaz.pi.gov.br/nfce/qrcode',
  },
  RJ: {
    production: 'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode',
    staging: 'https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode',
  },
  RN: {
    production: 'https://nfce.sefaz.rn.gov.br/consultarNFCe.aspx',
    staging: 'https://hom.nfce.sefaz.rn.gov.br/consultarNFCe.aspx',
  },
  RS: {
    production: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
    staging: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
  },
  RO: {
    production: 'http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',
    staging: 'http://www.nfce.sefin.ro.gov.br/consultanfce/consulta.jsp',
  },
  RR: {
    production: 'https://www.sefaz.rr.gov.br/nfce/servlet/qrcode',
    staging: 'http://200.174.88.103:8080/nfce/servlet/qrcode',
  },
  SC: {
    production: 'https://sat.sef.sc.gov.br/nfce/consulta?',
    staging: 'https://hom.sat.sef.sc.gov.br/nfce/consulta?',
  },
  SP: {
    production:
      'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx',
    staging:
      'https://www.homologacao.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx',
  },
  SE: {
    production: 'http://www.nfce.se.gov.br/nfce/qrcode?',
    staging: 'http://www.hom.nfe.se.gov.br/nfce/qrcode?',
  },
  TO: {
    production: 'http://www.sefaz.to.gov.br/nfce/qrcode',
    staging: 'http://homologacao.sefaz.to.gov.br/nfce/qrcode',
  },
};
