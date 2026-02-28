import * as https from 'https';
import { DigitalCertificate } from '../entities/fiscal-module.entity';
import { SOAP_NAMESPACES } from './nfe-endpoints.config';

export class NfeHttpClient {
  constructor(private readonly certificate: DigitalCertificate) {}

  buildSoapEnvelope(action: string, content: string): string {
    const namespace =
      SOAP_NAMESPACES[action] ||
      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4';

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="${namespace}">
  <soap12:Body>
    <nfe:nfeDadosMsg>${content}</nfe:nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
  }

  postSoap(
    host: string,
    path: string,
    body: string,
    action: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: host,
        port: 443,
        path,
        method: 'POST',
        pfx: this.certificate.pfxBuffer,
        passphrase: this.certificate.password,
        rejectUnauthorized: false,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(body, 'utf-8'),
          SOAPAction: action,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`),
            );
          } else {
            resolve(data);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(body);
      req.end();
    });
  }
}
