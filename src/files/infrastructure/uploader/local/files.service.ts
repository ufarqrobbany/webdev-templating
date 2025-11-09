import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileRepository } from '../../persistence/file.repository';
import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';

// Import modul 'path' dari node.js untuk menangani path file secara aman
import * as path from 'path'; // <-- TAMBAHKAN INI

@Injectable()
export class FilesLocalService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
  ) {}

  async create(file: Express.Multer.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const apiPrefix = this.configService.get('app.apiPrefix', {
      infer: true,
    });

    let filename: string;

    // Multer diskStorage seharusnya mengisi file.filename.
    // Jika tidak ada, gunakan path.basename() untuk mengekstrak nama file
    // dari path lengkap (file.path) yang pasti dibuat Multer.
    if (file.filename) {
      filename = file.filename;
    } else if (file.path) {
      // Gunakan path.basename() untuk memastikan kita hanya mendapatkan nama file
      // dari path fisik yang tersimpan (misalnya: 'files/unique-name.jpg' -> 'unique-name.jpg')
      filename = path.basename(file.path); // <-- Mengambil nama file dari path
    } else {
      // Jika kedua properti file.filename dan file.path tidak ada (kasus terburuk)
      throw new UnprocessableEntityException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: {
          file: 'fileProcessingError',
        },
      });
    }

    // Path yang disimpan ke database harus menjadi URL lengkap yang dapat diakses oleh publik:
    // Contoh: /api/v1/files/nama-file-unik.jpg
    const savedPath = `/${apiPrefix}/v1/files/${filename}`;

    return {
      file: await this.fileRepository.create({
        path: savedPath,
      }),
    };
  }
}
