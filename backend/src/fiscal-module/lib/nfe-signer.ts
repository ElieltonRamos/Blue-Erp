/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as forge from 'node-forge';
import { DigitalCertificate } from '../entities/fiscal-module.entity';

export class NfeSigner {
  private readonly certificate: DigitalCertificate;
  private privateKey!: forge.pki.rsa.PrivateKey;
  private publicCert!: forge.pki.Certificate;

  constructor(certificate: DigitalCertificate) {
    this.certificate = certificate;
    this.loadCertificate();
  }

  private loadCertificate(): void {
    try {
      const p12Der = forge.util.decode64(
        this.certificate.pfxBuffer.toString('base64'),
      );
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(
        p12Asn1,
        this.certificate.password,
      );

      const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
      });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

      if (!keyBag?.key) {
        throw new Error('Private key not found in certificate');
      }

      this.privateKey = keyBag.key as forge.pki.rsa.PrivateKey;

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];

      if (!certBag?.cert) {
        throw new Error('Public certificate not found');
      }

      this.publicCert = certBag.cert;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Error loading certificate: ${err.message}`);
    }
  }

  public signXml(xml: string): string {
    try {
      const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
      const xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');

      const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
      if (!infNFe) {
        throw new Error('infNFe element not found in XML');
      }

      const idNFe = infNFe.getAttribute('Id');
      if (!idNFe) {
        throw new Error('Id attribute not found in infNFe');
      }

      const serializer = new XMLSerializer();
      const infNFeStr = serializer
        .serializeToString(infNFe)
        .replace(/>\s+</g, '><');

      const md = forge.md.sha1.create();
      md.update(infNFeStr, 'utf8');
      const digestValue = forge.util.encode64(md.digest().bytes());

      const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI="#${idNFe}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

      const mdSign = forge.md.sha1.create();
      mdSign.update(signedInfo, 'utf8');
      const signatureValue = forge.util.encode64(this.privateKey.sign(mdSign));

      const certDer = forge.asn1
        .toDer(forge.pki.certificateToAsn1(this.publicCert))
        .getBytes();
      const certBase64 = forge.util.encode64(certDer);

      const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

      const nfeElement = xmlDoc.getElementsByTagName('NFe')[0];
      const signatureDoc = new DOMParser().parseFromString(
        signatureXml,
        'text/xml',
      );
      nfeElement.appendChild(
        xmlDoc.importNode(signatureDoc.documentElement, true),
      );

      return new XMLSerializer().serializeToString(xmlDoc);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Error signing XML: ${err.message}`);
    }
  }

  public validateCertificate(): void {
    const now = new Date();
    const { notBefore, notAfter } = this.publicCert.validity;

    if (now < notBefore) {
      throw new Error('Certificate is not yet valid');
    }

    if (now > notAfter) {
      throw new Error(
        `Certificate expired on ${notAfter.toLocaleDateString()}`,
      );
    }
  }

  public getCertificateInfo(): {
    holder: string;
    cnpj?: string;
    validity: { start: Date; end: Date };
    issuer: string;
  } {
    const subject = this.publicCert.subject;
    const issuer = this.publicCert.issuer;

    const holder =
      subject.attributes
        .find((a) => a.name === 'commonName')
        ?.value?.toString() || 'Not available';

    const cnpjMatch = holder.match(/(\d{14})/);

    const issuerName =
      issuer.attributes
        .find((a) => a.name === 'commonName')
        ?.value?.toString() || 'Not available';

    return {
      holder,
      cnpj: cnpjMatch?.[1],
      validity: {
        start: this.publicCert.validity.notBefore,
        end: this.publicCert.validity.notAfter,
      },
      issuer: issuerName,
    };
  }
}
