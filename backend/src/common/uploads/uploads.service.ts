import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

export const UPLOADS_URL_PREFIX = '/uploads';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const IMAGE_TYPES: Record<
  string,
  { ext: string; matches: (b: Buffer) => boolean }
> = {
  'image/jpeg': {
    ext: '.jpg',
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    ext: '.png',
    matches: (b) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    ext: '.webp',
    matches: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
};

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  // Valida tipo, tamanho e conteúdo real (magic bytes). Devolve a extensão.
  private validateImage(file: UploadedImage, actor: string): string {
    const type = IMAGE_TYPES[file?.mimetype];

    if (!file?.buffer || !type) {
      this.logger.warn(`Formato de imagem inválido (actor=${actor})`);
      throw new BadRequestException('Formato inválido. Use JPEG, PNG ou WebP');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      this.logger.warn(`Imagem acima do limite (actor=${actor})`);
      throw new BadRequestException('A imagem deve ter no máximo 2 MB');
    }
    if (!type.matches(file.buffer)) {
      this.logger.warn(
        `Conteúdo da imagem não confere com o tipo (actor=${actor})`,
      );
      throw new BadRequestException(
        'O arquivo enviado não é uma imagem válida',
      );
    }

    return type.ext;
  }

  // Grava com nome gerado no servidor e devolve o caminho relativo
  // (ex.: /uploads/products/{uuid}.webp), que é o que vai para o banco.
  async saveImage(
    file: UploadedImage,
    folder: string,
    actor: string,
  ): Promise<string> {
    const ext = this.validateImage(file, actor);
    const fileName = `${randomUUID()}${ext}`;
    const dir = path.join(UPLOADS_DIR, folder);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, fileName), file.buffer);

    return `${UPLOADS_URL_PREFIX}/${folder}/${fileName}`;
  }

  // Falha ao apagar vira warn e não interrompe a operação (guia 2.7)
  async remove(relativePath: string | null, actor: string): Promise<void> {
    if (!relativePath?.startsWith(`${UPLOADS_URL_PREFIX}/`)) return;

    const target = path.resolve(
      UPLOADS_DIR,
      relativePath.slice(UPLOADS_URL_PREFIX.length + 1),
    );

    // Impede sair da pasta de uploads
    if (!target.startsWith(UPLOADS_DIR + path.sep)) {
      this.logger.warn(
        `Caminho de upload fora da pasta permitida (actor=${actor})`,
      );
      return;
    }

    try {
      await fs.unlink(target);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Imagem antiga não removida (actor=${actor}): ${reason}`,
      );
    }
  }
}
