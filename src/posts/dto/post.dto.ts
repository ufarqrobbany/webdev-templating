import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class PostDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
