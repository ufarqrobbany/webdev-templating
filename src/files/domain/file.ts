import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';

export class FileType {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Allow()
  id: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/path/to/file.jpg',
  })
  @Transform(
    ({ value }) => {
      // value here is the path saved in the database, which is the S3/R2 Key (e.g., 'unique-id.jpg')
      const fileConfigData = fileConfig() as FileConfig;
      const appConfigData = appConfig() as AppConfig;

      if (fileConfigData.driver === FileDriver.LOCAL) {
        return appConfigData.backendDomain + value;
      } else if (
        [FileDriver.S3_PRESIGNED, FileDriver.S3].includes(fileConfigData.driver)
      ) {
        // V -- PERBAIKAN: Gunakan Public URL R2 jika tersedia -- V
        if (fileConfigData.awsS3PublicUrl) {
          const publicUrl = fileConfigData.awsS3PublicUrl.endsWith('/')
            ? fileConfigData.awsS3PublicUrl.slice(0, -1)
            : fileConfigData.awsS3PublicUrl;

          return `${publicUrl}/${value}`; // value adalah key objek (e.g., 'unique-id.jpg')
        }
        // ^ -- AKHIR PERBAIKAN -- ^

        // JIKA BUKAN R2 (atau R2 tidak punya public URL), maka generate pre-signed URL (DEFAULT S3)
        const s3 = new S3Client({
          region: fileConfigData.awsS3Region ?? '',
          credentials: {
            accessKeyId: fileConfigData.accessKeyId ?? '',
            secretAccessKey: fileConfigData.secretAccessKey ?? '',
          },
          // PENTING UNTUK R2: Tambahkan endpoint R2 jika ada
          ...(fileConfigData.awsS3Endpoint && {
            endpoint: fileConfigData.awsS3Endpoint,
          }),
        });

        const command = new GetObjectCommand({
          Bucket: fileConfigData.awsDefaultS3Bucket ?? '',
          Key: value, // value is the key from the database
        });

        return getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      return value;
    },
    {
      toPlainOnly: true,
    },
  )
  path: string;
}
