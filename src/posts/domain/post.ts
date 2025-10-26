import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { User } from '../../users/domain/user';

export class Post {
  @Allow()
  id: number;

  @Allow()
  content: string;

  @Allow()
  @ApiProperty({ type: () => User })
  author: User;

  createdAt: Date;
  updatedAt: Date;
}
