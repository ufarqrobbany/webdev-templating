import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { Type } from 'class-transformer';

// 1. DEFINISI KENDALA (CONSTRAINT)
@ValidatorConstraint({ name: 'isContentOrPhotoRequired', async: false })
export class IsContentOrPhotoRequiredConstraint
  implements ValidatorConstraintInterface
{
  // 2. PERBAIKI FUNGSI 'validate'
  validate(value: any, args: ValidationArguments): boolean { // <-- Tambah ': boolean'
    const dto = args.object as CreatePostDto;

    // Cek apakah content "berisi" (bukan cuma string kosong)
    const hasContent = dto.content && dto.content.trim().length > 0;
    
    // Cek apakah photo "berisi" (punya ID)
    const hasPhoto = dto.photo && dto.photo.id;

    // Harus return boolean secara eksplisit
    if (hasContent || hasPhoto) {
      return true;
    }

    return false; // <-- Ini memperbaiki error 'undefined is not assignable'
  }

  defaultMessage(args: ValidationArguments) {
    return 'Konten (content) atau foto (photo.id) harus diisi dan tidak boleh kosong.';
  }
}

// 3. PERBAIKI PENERAPAN DECORATOR
// @Validate(...) TIDAK bisa diletakkan di atas class.
export class CreatePostDto {
  
  // 4. TERAPKAN @Validate KE SALAH SATU PROPERTI (misal: content)
  // Validator ini akan tetap menerima seluruh DTO object (via args.object)
  @ApiPropertyOptional({ example: 'Ini adalah postingan pertama saya!' })
  @IsString()
  @IsOptional()
  @Validate(IsContentOrPhotoRequiredConstraint) // <-- PINDAHKAN KE SINI
  content?: string;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  photo?: FileDto | null;
}