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

// v-- PERBAIKAN 4: Ganti nama import module --v
import { FilesLocalModule } from 'src/files/infrastructure/uploader/local/files.module';
// ^-- Nama class-nya 'FilesLocalModule' --^

@Module({
  imports: [
    // do not remove this comment
    RelationalPostPersistenceModule,
    FilesModule,
    TypeOrmModule.forFeature([PostEntity, UserEntity]),
    FilesLocalModule, // <-- PERBAIKAN 5: Tambahkan module yang benar
    CommentsModule,
  ],
  controllers: [PostsController],
  // v-- PERBAIKAN 6: Hapus 'PostRepository' dari providers --v
  providers: [PostsService],
  // ^-- Error TS2322 hilang karena PostRepository sudah di-provide oleh RelationalPostPersistenceModule --^
  exports: [PostsService, RelationalPostPersistenceModule],
})
export class PostsModule {}