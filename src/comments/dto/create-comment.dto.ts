import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'ID Postingan', type: Number })
  @IsNumber()
  postId: number; // Sudah number

  // !! PERUBAHAN DI SINI !! parentId menjadi number
  @ApiProperty({
    required: false,
    description: 'ID Komentar induk (jika balasan)',
    type: Number,
  })
  @IsNumber() // Validasi sebagai number
  @IsOptional()
  parentId?: number; // Tipe data number
}
