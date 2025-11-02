import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../../config/config.type';
import { FileConfig } from '../../../config/file-config.type'; // <-- Import FileConfig

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

    // Ambil objek konfigurasi 'file' dan gunakan Type Assertion (as FileConfig)
    const fileConfig = this.configService.get('file', {
        infer: true,
    }) as FileConfig;
    
    // Properti ini sekarang ada di FileConfig yang sudah diperbarui
    let publicUrl = fileConfig?.awsS3PublicUrl;
    
    let savedPath = file.key;
    
    // Gunakan Type Guard: Memastikan publicUrl ada (truthy) dan tipenya adalah 'string'.
    if (publicUrl && typeof publicUrl === 'string') {
        // Operasi string sekarang aman (endsWith)
        const normalizedPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        savedPath = `${normalizedPublicUrl}/${file.key}`;
    }

    return {
      file: await this.fileRepository.create({
        path: savedPath,
      }),
    };
  }
}