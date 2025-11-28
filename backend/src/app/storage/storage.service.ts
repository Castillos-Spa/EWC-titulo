import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
];

export interface UploadOptions {
  folder?: string;
  allowedMimeTypes?: string[];
}

export interface StoredObject {
  key: string;
  url: string;
  size: number;
  contentType: string;
  originalName: string;
}

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_KEY');
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const endpoint = this.normalizeUrl(this.configService.get<string>('R2_CDN_URL'));

    if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
      throw new Error('Las credenciales de R2 no están configuradas correctamente');
    }

    this.bucketName = bucketName;
    this.publicBaseUrl = `${endpoint}/${this.bucketName}`;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: UploadedFile, options: UploadOptions = {}): Promise<StoredObject> {
    if (!file) {
      throw new BadRequestException('Archivo no recibido');
    }

    if (!file.buffer) {
      throw new BadRequestException('El archivo está vacío o no se pudo procesar');
    }

    const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no soportado: ${file.mimetype}`);
    }

    const key = this.buildObjectKey(file, options.folder);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error subiendo archivo a R2: ${err.message}`, err.stack);
      throw new InternalServerErrorException('No se pudo subir el archivo, intenta nuevamente más tarde.');
    }

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
      size: file.size,
      contentType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async uploadFiles(files: UploadedFile[], options: UploadOptions = {}): Promise<StoredObject[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron archivos');
    }

    const uploads = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploads);
  }

  async getSignedUrl(objectReference: string, expiresInSeconds = 900): Promise<string> {
    const key = this.extractObjectKey(objectReference);
    if (!key) {
      throw new BadRequestException('Referencia de objeto inválida');
    }

    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
        { expiresIn: expiresInSeconds },
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error generando URL firmada para ${key}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('No se pudo generar el enlace temporal para el archivo.');
    }
  }

  async getSignedUrls(objectReferences: string[], expiresInSeconds = 900): Promise<string[]> {
    return Promise.all(
      (objectReferences ?? []).map(async reference => {
        try {
          return await this.getSignedUrl(reference, expiresInSeconds);
        } catch (error) {
          const err = error as Error;
          this.logger.warn(
            `Fallo generando URL firmada para ${reference}: ${err.message}. Se devolverá la referencia original.`,
          );
          return reference;
        }
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    if (!key || key.trim().length === 0) {
      throw new BadRequestException('Clave de objeto inválida');
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error eliminando archivo de R2: ${err.message}`, err.stack);
      throw new InternalServerErrorException('No se pudo eliminar el archivo en almacenamiento');
    }
  }

  getObjectKey(reference: string): string | null {
    return this.extractObjectKey(reference);
  }

  private buildObjectKey(file: UploadedFile, folder?: string): string {
    const cleanFolder = folder ? folder.replace(/(^\/+|\/+?$)/g, '') : undefined;
    const extension = extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    return [cleanFolder, filename].filter(Boolean).join('/');
  }

  private extensionFromMime(mime: string): string {
    if (!mime) {
      return '';
    }

    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/heic': '.heic',
      'image/heif': '.heif',
      'application/pdf': '.pdf',
    };

    return map[mime] ?? '';
  }

  private normalizeUrl(url?: string): string {
    if (!url) {
      return '';
    }
    return url.replace(/\/$/, '');
  }

  private extractObjectKey(reference: string): string | null {
    if (!reference) {
      return null;
    }

    const trimmed = reference.trim();
    if (!trimmed) {
      return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      try {
        const url = new URL(trimmed);
        let path = url.pathname;
        if (path.startsWith('/')) {
          path = path.slice(1);
        }
        if (!path) {
          return null;
        }
        if (path.startsWith(`${this.bucketName}/`)) {
          path = path.slice(this.bucketName.length + 1);
        }
        return decodeURIComponent(path);
      } catch (error) {
        this.logger.warn(`No se pudo parsear la URL ${trimmed} para obtener el key.`);
        return null;
      }
    }

    return trimmed.replace(/^\/+/, '');
  }
}
