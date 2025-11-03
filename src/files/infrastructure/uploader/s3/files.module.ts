import {
  HttpStatus,
  Module,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilesS3Controller } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ListBucketsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

import { FilesS3Service } from './files.service';

import { DocumentFilePersistenceModule } from '../../persistence/document/document-persistence.module';
import { RelationalFilePersistenceModule } from '../../persistence/relational/relational-persistence.module';
import { AllConfigType } from '../../../../config/config.type';
import { DatabaseConfig } from '../../../../database/config/database-config.type';
import databaseConfig from '../../../../database/config/database.config';
// PASTIKAN ANDA SUDAH MENGIMPOR INI DI BARIS ATAS
import { FileConfig } from '../../../config/file-config.type'; 

// <database-block>
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentFilePersistenceModule
  : RelationalFilePersistenceModule;
// </database-block>

@Module({
  imports: [
    infrastructurePersistenceModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        
        // --- START PERBAIKAN: Mengambil objek konfigurasi 'file' ---
        // 1. Ambil seluruh objek konfigurasi 'file' dan gunakan Type Assertion
        const fileConfig = configService.get('file', { infer: true }) as FileConfig;

        // 2. Akses properti langsung dari objek yang sudah di-cast
        const region = fileConfig?.awsS3Region || 'auto';
        const endpoint = fileConfig?.awsS3Endpoint;

        // 3. Tambahkan check manual untuk mandatory fields (untuk menggantikan getOrThrow yang bermasalah dengan typing)
        if (!fileConfig?.accessKeyId || !fileConfig?.secretAccessKey || !fileConfig?.awsDefaultS3Bucket) {
             throw new Error('Missing R2/S3 credentials (accessKeyId, secretAccessKey, or awsDefaultS3Bucket) in file configuration.');
        }

        const s3 = new S3Client({
          // region sekarang adalah string (awsS3Region atau 'auto')
          region: region, 
          credentials: {
            accessKeyId: fileConfig.accessKeyId, // Menggunakan properti objek
            secretAccessKey: fileConfig.secretAccessKey, // Menggunakan properti objek
          },
          // PENTING UNTUK R2: Menambahkan endpoint R2
          ...(endpoint && { endpoint: endpoint }), 
        });
        // --- END PERBAIKAN ---

        // v-- TAMBAHKAN BLOK DEBUGGING INI --v
        try {
          // Uji koneksi dengan perintah yang memerlukan izin ke bucket spesifik
          const bucketName = configService.getOrThrow('file.awsDefaultS3Bucket', { infer: true });
          console.log(`TESTING S3/R2 CONNECTIVITY for BUCKET: ${bucketName}...`);
          
          // Tes ListObjectsV2Command untuk menguji izin baca ke bucket "sosmedkita"
          const data = await s3.send(new ListObjectsV2Command({
              Bucket: bucketName,
              MaxKeys: 1, // Hanya ambil 1 objek
          }));
          
          if (data.Name) {
            console.log(`✅ S3/R2 CONNECTION SUCCESSFUL. Key has read access to bucket: ${data.Name}.`);
          } else {
            console.log('⚠️ S3/R2 Connection OK, but unexpected response.');
          }
        } catch (error) {
          console.error('❌ S3/R2 CONNECTION FAILED!!! (Check Key, Secret, and BUCKET PERMISSIONS)');
          console.error('Error Details:', error.name, error.message);
          
          throw new Error('R2/S3 Connectivity Test Failed. See console for details.'); 
        }

        return {
          fileFilter: (request, file, callback) => {
            // ... (fileFilter logic)
            // ...
            callback(null, true);
          },
          storage: multerS3({
            s3: s3,
            // Menggunakan objek config yang sudah dicek
            bucket: fileConfig.awsDefaultS3Bucket, 
            contentType: multerS3.AUTO_CONTENT_TYPE,
            // acl: 'public-read', // <-- BARIS INI KITA HAPUS
            // v-- PERBAIKAN: Tambahkan ACL hanya jika TIDAK menggunakan endpoint kustom (R2) --v
            ...(endpoint ? {} : { acl: 'public-read' }),
            key: (request, file, callback) => {
              callback(
                null,
                `${randomStringGenerator()}.${file.originalname
                  .split('.')
                  .pop()
                  ?.toLowerCase()}`,
              );
            },
          }),
          limits: {
            // Menggunakan get saja dengan infer: true (asumsi maxFileSize adalah number)
            fileSize: configService.get('file.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [FilesS3Controller],
  providers: [FilesS3Service],
  exports: [FilesS3Service],
})
export class FilesS3Module {}