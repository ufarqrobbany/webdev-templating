import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm'; // Import In & FindOptionsWhere
import { CommentEntity } from '../entities/comment.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Comment } from '../../../../domain/comment';
import { CommentRepository } from '../../comment.repository';
import { CommentMapper } from '../mappers/comment.mapper';
import { FindAllCommentsDto } from '../../../../dto/find-all-comments.dto'; // Import DTO filter jika ada
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { DeepPartial } from 'src/utils/types/deep-partial.type'; // Import DeepPartial

@Injectable()
export class CommentRelationalRepository implements CommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
  ) {}

  async create(data: Comment): Promise<Comment> {
    const persistenceModel = CommentMapper.toPersistence(data);
    const newEntity = await this.commentRepository.save(
      this.commentRepository.create(persistenceModel),
    );
    return CommentMapper.toDomain(newEntity);
  }

  /**
   * DIUBAH: Nama fungsi dan parameter agar sesuai interface
   */
  async findAll({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllCommentsDto | null; // Gunakan DTO Filter jika ada
    paginationOptions: IPaginationOptions;
  }): Promise<Comment[]> {
    const where: FindOptionsWhere<CommentEntity> = {}; // Siapkan object filter
    if (filterOptions?.postId) {
      // Contoh filter by postId jika ada di DTO
      where.post = { id: filterOptions.postId };
    }
    // Tambahkan filter lain di sini jika perlu

    const entities = await this.commentRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where, // Terapkan filter
      // Tambahkan relasi jika perlu dimuat di sini
      // relations: { author: true, post: true },
      // Tambahkan order jika perlu
      // order: { createdAt: 'ASC' }
    });

    return entities.map((entity) => CommentMapper.toDomain(entity));
  }

  /**
   * DIUBAH: Nama fungsi dan tipe ID ke number
   */
  async findOne(id: number): Promise<NullableType<Comment>> {
    const entity = await this.commentRepository.findOne({
      where: { id },
    });

    return entity ? CommentMapper.toDomain(entity) : null;
  }

  /**
   * DIUBAH: Tipe ID ke number[]
   */
  async findByIds(ids: number[]): Promise<Comment[]> {
    const entities = await this.commentRepository.find({
      where: { id: In(ids) }, // Gunakan In() untuk array ID
    });

    return entities.map((entity) => CommentMapper.toDomain(entity));
  }

  /**
   * DIUBAH: Tipe ID ke number
   */
  async update(
    id: number,
    payload: DeepPartial<Comment>,
  ): Promise<Comment | null> {
    // 1. Dapatkan data entity saat ini
    const entity = await this.commentRepository.findOne({ where: { id } });
    if (!entity) {
      return null; // Atau throw error jika record harus ada
    }

    // 2. Gabungkan data lama dengan payload baru (patch)
    // Kita perlu Mapper di sini untuk memastikan tipe data benar
    const domainPayload = CommentMapper.toDomain({
      ...entity,
      ...payload,
    } as CommentEntity);
    const persistencePayload = CommentMapper.toPersistence(domainPayload);

    // 3. Simpan perubahan (save akan menangani create/update)
    const updatedEntity = await this.commentRepository.save(persistencePayload);

    return CommentMapper.toDomain(updatedEntity);
  }

  /**
   * DIUBAH: Nama fungsi dan tipe ID ke number, gunakan softDelete
   */
  async softDelete(id: number): Promise<void> {
    await this.commentRepository.softDelete(id); // Gunakan softDelete
  }
}
