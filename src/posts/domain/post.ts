import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { User } from '../../users/domain/user';
import { FileType } from '../../files/domain/file'; // <-- 1. IMPORT
import { Comment } from '../../comments/domain/comment';

export class Post {
  @Allow()
  id: number;

  @Allow()
  content: string | null;

  @Allow()
  @ApiProperty({ type: () => User })
  author: User;

  @Allow() // <-- 2. TAMBAHKAN
  @ApiProperty({ type: () => FileType, nullable: true }) // <-- 3. TAMBAHKAN
  photo?: FileType | null; // <-- 4. TAMBAHKAN

  @Allow()
  @ApiProperty({ type: () => [User] })
  likedBy?: User[];

  @Allow()
  @ApiProperty({ type: Number, example: 0 })
  likesCount: number;

  @Allow()
  @ApiProperty({ type: () => [Comment] })
  comments?: Comment[];

  createdAt: Date;
  updatedAt: Date;
}
