import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class Post {
  @Allow()
  id: number;

  @Allow()
  content: string;

  createdAt: Date;
  updatedAt: Date;
}
