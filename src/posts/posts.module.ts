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

@Module({
  imports: [
    // do not remove this comment
    RelationalPostPersistenceModule,
    // Jika Anda ingin mengandalkan konfigurasi dinamis (FILE_DRIVER), Anda dapat menghapus FilesS3Module
    // dan hanya mengimpor FilesModule, tetapi karena PostsService Anda menginject implementasi SPESIFIK (FilesS3Service),
    // kita harus mengimpor module spesifiknya (FilesS3Module) di sini.
    FilesModule, 
    TypeOrmModule.forFeature([PostEntity, UserEntity]),
    FilesS3Module, // <-- MODIFIKASI: Ganti FilesLocalModule dengan FilesS3Module
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService, RelationalPostPersistenceModule],
})
export class PostsModule {}