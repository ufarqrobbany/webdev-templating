import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // <-- MODIFIED
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  // v-- ADDED --v
  @ApiPropertyOptional({ description: 'ID of the post being commented on' })
  @IsNumber()
  @IsOptional()
  postId?: number;

  @ApiPropertyOptional({ description: 'ID of the parent comment (for replies)' })
  @IsNumber()
  @IsOptional()
  parentId?: number;
  // ^-- ADDED --^
}