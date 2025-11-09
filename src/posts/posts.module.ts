// src/posts/posts.module.ts

import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { RelationalPostPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesModule } from '../files/files.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './infrastructure/persistence/relational/entities/post.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';

import { FilesS3Module } from 'src/files/infrastructure/uploader/s3/files.module';
import { CommentsModule } from '../comments/comments.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { FileConfig } from '../files/config/file-config.type';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
// ^-- Sesuaikan dengan FilesS3Service yang diinject di PostsService --^

@Module({
  imports: [
    // do not remove this comment
    RelationalPostPersistenceModule,
    // Jika Anda ingin mengandalkan konfigurasi dinamis (FILE_DRIVER), Anda dapat menghapus FilesS3Module
    // dan hanya mengimpor FilesModule, tetapi karena PostsService Anda menginject implementasi SPESIFIK (FilesS3Service),
    // kita harus mengimpor module spesifiknya (FilesS3Module) di sini.
    FilesModule,
    TypeOrmModule.forFeature([PostEntity, UserEntity]),
    FilesS3Module,
    CommentsModule,
    // Register MulterModule with S3 configuration for file uploads in posts
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        const fileConfig = configService.get('file', {
          infer: true,
        }) as FileConfig;

        const region = fileConfig?.awsS3Region || 'auto';
        const endpoint = fileConfig?.awsS3Endpoint;

        if (
          !fileConfig?.accessKeyId ||
          !fileConfig?.secretAccessKey ||
          !fileConfig?.awsDefaultS3Bucket
        ) {
          throw new Error(
            'Missing R2/S3 credentials (accessKeyId, secretAccessKey, or awsDefaultS3Bucket) in file configuration.',
          );
        }

        const s3 = new S3Client({
          region: region,
          credentials: {
            accessKeyId: fileConfig.accessKeyId,
            secretAccessKey: fileConfig.secretAccessKey,
          },
          ...(endpoint && { endpoint: endpoint }),
        });

        return {
          fileFilter: (request, file, callback) => {
            callback(null, true);
          },
          storage: multerS3({
            s3: s3,
            bucket: fileConfig.awsDefaultS3Bucket,
            contentType: multerS3.AUTO_CONTENT_TYPE,
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
            fileSize: configService.get('file.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService, RelationalPostPersistenceModule],
})
export class PostsModule {}
