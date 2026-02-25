import { HttpException, HttpStatus } from '@nestjs/common';

export class FiscalException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class NfceAlreadyEmittedException extends FiscalException {
  constructor(accessKey: string) {
    super(
      `NFC-e already emitted for this sale. Key: ${accessKey}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidAccessKeyException extends FiscalException {
  constructor() {
    super('Invalid access key', HttpStatus.BAD_REQUEST);
  }
}

export class CertificateException extends FiscalException {
  constructor(message: string = 'Invalid or expired digital certificate') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class SefazException extends FiscalException {
  constructor(message: string) {
    super(`SEFAZ error: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class NfceNotFoundException extends FiscalException {
  constructor(identifier: string) {
    super(`NFC-e not found: ${identifier}`, HttpStatus.NOT_FOUND);
  }
}
