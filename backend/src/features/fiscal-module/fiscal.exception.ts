import { HttpException, HttpStatus } from '@nestjs/common';

export class FiscalException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class FiscalAlreadyEmittedException extends FiscalException {
  constructor(accessKey: string) {
    super(
      `Documento fiscal já emitido para esta venda. Chave: ${accessKey}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidAccessKeyException extends FiscalException {
  constructor() {
    super('Chave de acesso inválida', HttpStatus.BAD_REQUEST);
  }
}

export class CertificateException extends FiscalException {
  constructor(message: string = 'Certificado digital inválido ou expirado') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class SefazException extends FiscalException {
  constructor(message: string) {
    super(`Erro da SEFAZ: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class FiscalNotFoundException extends FiscalException {
  constructor(identifier: string) {
    super(
      `Documento fiscal não encontrado: ${identifier}`,
      HttpStatus.NOT_FOUND,
    );
  }
}
