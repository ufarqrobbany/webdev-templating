import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CommentDto {
  @ApiProperty({ example: 1, type: Number }) // <-- UBAH KE NUMBER
  @IsNumber() // <-- TAMBAHKAN VALIDATOR
  id: number; // <-- UBAH KE NUMBER
}
