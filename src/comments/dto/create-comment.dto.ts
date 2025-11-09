import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer'; // <--- TAMBAHKAN INI

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'ID Postingan', type: Number })
  // 1. Jika nilai adalah string kosong, ubah menjadi undefined.
  @Transform(({ value }) => (value === '' ? undefined : value))
  // 2. Konversi nilai yang tersisa menjadi Number.
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty() // <-- TAMBAHKAN eksplisit agar kegagalan 'should not be empty' lebih pasti saat transform menghasilkan undefined
  postId: number; // Tetap wajib (mandatory)

  // !! PERUBAHAN DI SINI !! parentId menjadi number
  @ApiProperty({
    required: false,
    description: 'ID Komentar induk (jika balasan)',
    type: Number,
  })
  @Transform(({ value }) => (value === '' ? undefined : value)) // <-- TAMBAHKAN INI
  @Type(() => Number) // <-- TAMBAHKAN INI
  @IsNumber() // Validasi sebagai number
  @IsOptional()
  parentId?: number; // Tipe data number
}
