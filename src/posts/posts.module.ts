import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { RelationalPostPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesModule } from '../files/files.module'; // <-- 1. IMPORT MODUL INI

@Module({
  imports: [
    // do not remove this comment
    RelationalPostPersistenceModule,
    FilesModule, // <-- 2. TAMBAHKAN MODUL INI DI SINI
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService, RelationalPostPersistenceModule],
})
export class PostsModule {}