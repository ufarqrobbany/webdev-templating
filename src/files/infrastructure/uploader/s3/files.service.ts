import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../../config/config.type';
import { FileConfig } from '../../../config/file-config.type'; 

import { Express } from 'express';

@Injectable()
export class FilesS3Service {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async create(file: Express.MulterS3.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const fileConfig = this.configService.get('file', {
        infer: true,
    }) as FileConfig;
    
    // Dapatkan URL publik base dari konfigurasi
    const publicUrlBase = fileConfig?.awsS3PublicUrl ?? '';
    
    // Kunci objek S3/R2 (yang kita tahu bisa kosong)
    const fileKey = file.key ?? '';
    
    // URL LENGKAP dari multer-s3
    const fileLocation = file.location ?? '';
    
    let keyToSave: string = fileKey;

    if (!keyToSave && fileLocation) {
        // PERBAIKAN: Jika file.key kosong, coba ekstrak key dari file.location
        if (publicUrlBase && fileLocation.startsWith(publicUrlBase)) {
            // Asumsi fileLocation adalah full URL. Ambil sisanya sebagai key
            keyToSave = fileLocation.substring(publicUrlBase.length);
            // Hapus leading slash jika ada
            if (keyToSave.startsWith('/')) {
                keyToSave = keyToSave.substring(1);
            }
        } else {
             // Jika fileLocation ada tapi bukan pola R2 (misal hanya key), simpan saja
             keyToSave = fileLocation;
        }
    }
    
    if (!keyToSave) {
        // Jika fileKey dan fileLocation sama-sama gagal memberikan kunci, throw error yang jelas.
        throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
                // Gunakan error yang lebih informatif
                file: 'uploadFailedToGetKey: S3 key or location missing from response.',
            },
        });
    }

    return {
      file: await this.fileRepository.create({
        path: keyToSave,
      }),
    };
  }
}