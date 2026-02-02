// interfaces/company.ts
export interface Company {
  id?: number; // ID único da empresa
  cnpj: string; // CNPJ da empresa
  corporateName: string; // Razão social da empresa
  tradeName: string; // Nome fantasia
  stateRegistration: string; // Inscrição estadual
  taxRegime: '1' | '2' | '3'; // Regime tributário (1=Simples Nacional, 2=Simples Nacional - Excesso, 3=Regime Normal)
  street: string; // Logradouro (rua, avenida, etc)
  number: string; // Número do endereço
  complement?: string; // Complemento do endereço
  neighborhood: string; // Bairro
  city: string; // Município
  cityCode: string; // Código do município (IBGE)
  state: string; // UF (estado)
  zipCode: string; // CEP
  phone: string; // Telefone
  email?: string; // E-mail
  nfceSeries: string; // Série da NFC-e
  nfceCurrentNumber: number; // Número atual da NFC-e
  nfceEnvironment: 'production' | 'staging'; // Ambiente da NFC-e (produção ou homologação)
  nfceCsc: string; // Código de Segurança do Contribuinte
  nfceCscId: string; // ID do CSC
  certificatePath: string; // Caminho do certificado digital
  certificatePassword: string; // Senha do certificado digital
  certificateExpirationDate?: Date; // Data de expiração do certificado
  ibptVersion: string; // Versão da tabela IBPT
  licenseKey: string;
  licenseToken: string;
}
