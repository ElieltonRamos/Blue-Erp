export interface DigitalCertificate {
  pfxBuffer: Buffer;
  password: string;
}

export interface NFeConfiguration {
  environment: string;
  state: string;
}

export interface SefazReturn {
  success: boolean;
  statusCode?: string;
  protocol?: string;
  message: string;
  signedXml?: string;
  accessKey?: string;
  authorizationDate?: string;
  xmlProtocol?: string;
  errors?: string[];
}

export interface EmissionResult {
  accessKey: string;
  protocol?: string;
  xmlPath: string;
  pdfPath?: string;
  status: 'authorized' | 'rejected' | 'contingency';
  message: string;
}

export interface StoragePaths {
  xmlDir: string;
  pdfDir: string;
  xmlPath: string;
  pdfPath?: string;
}

export interface CancelNFeParams {
  accessKey: string;
  protocol: string;
  justification: string;
  cnpj: string;
}
