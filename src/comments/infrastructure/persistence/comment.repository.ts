import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Comment } from '../../domain/comment';
import { FindAllCommentsDto } from '../../dto/find-all-comments.dto'; // <-- Import DTO Filter

export abstract class CommentRepository {
  abstract create(
    // Tipe Omit sudah benar (karena Comment domain id sudah number)
    data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, // <-- Tambah deletedAt jika pakai soft delete
  ): Promise<Comment>;

  // !! PERUBAHAN NAMA & PARAMETER !!
  abstract findAll({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllCommentsDto | null; // <-- Tambah filterOptions
    paginationOptions: IPaginationOptions;
  }): Promise<Comment[]>;

  // !! PERUBAHAN NAMA & TIPE ID !!
  abstract findOne(id: number): Promise<NullableType<Comment>>; // <-- Ganti nama & tipe ID

  // !! PERUBAHAN TIPE ID !!
  abstract findByIds(ids: number[]): Promise<Comment[]>; // <-- Ganti tipe ID

  // !! PERUBAHAN TIPE ID !!
  abstract update(
    id: number, // <-- Ganti tipe ID
    payload: DeepPartial<Comment>,
  ): Promise<Comment | null>;

  // !! PERUBAHAN NAMA & TIPE ID !!
  abstract softDelete(id: number): Promise<void>; // <-- Ganti nama & tipe ID
}
