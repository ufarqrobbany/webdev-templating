import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer'; // <-- Tambahkan import Transform

export class FindAllCommentsDto {
  // Properti lain yang mungkin sudah ada (misal: authorId) biarkan saja

  @ApiPropertyOptional({
    description: 'Filter komentar berdasarkan ID Postingan',
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10)) // <-- Tambahkan Transform untuk query string
  @IsNumber()
  postId?: number; // <-- TAMBAHKAN INI (opsional agar bisa get all comments juga)
}
