import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Ini adalah postingan pertama saya!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
