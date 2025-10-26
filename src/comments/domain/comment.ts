import { Allow } from 'class-validator';
import { User } from '../../users/domain/user'; // <-- ADD
import { Post } from '../../posts/domain/post'; // <-- ADD
import { ApiProperty } from '@nestjs/swagger'; // <-- ADD

export class Comment {
  @Allow()
  id: number;

  @Allow()
  content: string;

  // v-- ADDED relational properties --v
  @Allow()
  @ApiProperty({ type: () => User })
  author: User;

  @Allow()
  @ApiProperty({ type: () => Post })
  post: Post;

  @Allow()
  @ApiProperty({ type: () => Comment, nullable: true })
  parent?: Comment | null;

  @Allow()
  @ApiProperty({ type: () => [Comment] })
  replies?: Comment[];
  // ^-- ADDED --^

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
