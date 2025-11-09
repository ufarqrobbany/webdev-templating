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

@ValidatorConstraint({ name: 'isContentOrPhotoRequired', async: false })
export class IsContentOrPhotoRequiredConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CreatePostDto;

    // Cek apakah content "berisi" (bukan cuma string kosong)
    const hasContent = dto.content && dto.content.trim().length > 0;

    // Cek apakah photo "berisi" (punya ID)
    const hasPhoto = dto.photo && dto.photo.id;

    // Harus return boolean secara eksplisit
    if (hasContent || hasPhoto) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Konten (content) atau foto (photo.id) harus diisi dan tidak boleh kosong.';
  }
}

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'Ini adalah postingan pertama saya!' })
  @IsString()
  @IsOptional()
  @Validate(IsContentOrPhotoRequiredConstraint)
  content?: string;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  photo?: FileDto | null;
}
