import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { DigitalCertificate } from '../entities/fiscal-module.entity';

export class NfeSigner {
  private readonly certificate: DigitalCertificate;
  private privateKeyPem!: string;
  private publicCertPem!: string;
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

      this.privateKeyPem = forge.pki.privateKeyToPem(
        keyBag.key as forge.pki.rsa.PrivateKey,
      );

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];

      if (!certBag?.cert) {
        throw new Error('Public certificate not found');
      }

      this.publicCert = certBag.cert;
      this.publicCertPem = forge.pki.certificateToPem(this.publicCert);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Error loading certificate: ${err.message}`);
    }
  }

  public signXml(xml: string): string {
    try {
      const certBase64 = this.publicCertPem.replace(
        /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n|\r/g,
        '',
      );

      const sig = new SignedXml({
        privateKey: this.privateKeyPem,
        publicCert: certBase64,
        canonicalizationAlgorithm:
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      });

      sig.getKeyInfoContent = () =>
        `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`;

      sig.addReference({
        xpath: "//*[local-name(.)='infNFe']",
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        ],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      });

      sig.computeSignature(xml, {
        location: {
          reference: "//*[local-name(.)='infNFe']",
          action: 'after',
        },
      });

      return sig.getSignedXml();
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

  public signXmlById(xml: string, elementId: string): string {
    try {
      const certBase64 = this.publicCertPem.replace(
        /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n|\r/g,
        '',
      );

      const sig = new SignedXml({
        privateKey: this.privateKeyPem,
        publicCert: certBase64,
        canonicalizationAlgorithm:
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      });

      sig.getKeyInfoContent = () =>
        `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`;

      sig.addReference({
        xpath: `//*[@Id='${elementId}']`,
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        ],
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      });

      sig.computeSignature(xml, {
        location: {
          reference: `//*[@Id='${elementId}']`,
          action: 'after',
        },
      });

      return sig.getSignedXml();
    } catch (error) {
      const err = error as Error;
      throw new Error(`Error signing XML by ID: ${err.message}`);
    }
  }
}
