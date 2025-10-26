import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { RelationalCommentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalCommentPersistenceModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService, RelationalCommentPersistenceModule],
})
export class CommentsModule {}
