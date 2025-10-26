import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { RelationalPostPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalPostPersistenceModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService, RelationalPostPersistenceModule],
})
export class PostsModule {}
