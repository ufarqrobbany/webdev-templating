import { Module } from '@nestjs/common';
import { CommentRepository } from '../comment.repository';
import { CommentRelationalRepository } from './repositories/comment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity])],
  providers: [
    {
      provide: CommentRepository,
      useClass: CommentRelationalRepository,
    },
  ],
  exports: [CommentRepository],
})
export class RelationalCommentPersistenceModule {}
