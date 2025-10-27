import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PostEntity } from '../entities/post.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Post } from '../../../../domain/post';
import { PostRepository } from '../../post.repository';
import { PostMapper } from '../mappers/post.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FindAllPostsDto } from '../../../../dto/find-all-posts.dto';

@Injectable()
export class PostRelationalRepository implements PostRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async create(data: Post): Promise<Post> {
    const persistenceModel = PostMapper.toPersistence(data);
    const newEntity = await this.postRepository.save(
      this.postRepository.create(persistenceModel),
    );
    return PostMapper.toDomain(newEntity);
  }

  async findAll({
    filterOptions,
    paginationOptions,
    followingUserIds,
  }: {
    filterOptions?: FindAllPostsDto | null;
    paginationOptions: IPaginationOptions;
    followingUserIds?: (number | string)[];
  }): Promise<Post[]> {
    const where: any = {};

    // Jika daftar ID yang di-follow diberikan (user sedang login)
    if (followingUserIds && followingUserIds.length > 0) {
      where.author = { id: In(followingUserIds.map((id) => Number(id))) };
    } else if (followingUserIds && followingUserIds.length === 0) {
      // Jika user login tapi tidak follow siapa-siapa, kembalikan array kosong
      return [];
    }
    // Jika followingUserIds tidak diberikan (undefined), 'where' tetap kosong
    // dan semua postingan akan diambil (untuk user anonim)

    const entities = await this.postRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: {
        createdAt: 'DESC', // Postingan terbaru di atas
        comments: {
          createdAt: 'ASC', // Komentar terlama di atas
          replies: {
            createdAt: 'ASC', // Balasan terlama di atas
          },
        },
      },
      relations: ['author', 'likedBy', 'comments',
        'comments.author',
        'comments.parent',
        'comments.replies',
        'comments.replies.author',],
    });

    return entities.map((post) => PostMapper.toDomain(post));
  }

  async findOne(id: number): Promise<NullableType<Post>> {
    const entity = await this.postRepository.findOne({
      where: { id },
    });
    return entity ? PostMapper.toDomain(entity) : null;
  }

  async findByIds(ids: number[]): Promise<Post[]> {
    const entities = await this.postRepository.find({
      where: ids.map((id) => ({ id })),
    });
    return entities.map((post) => PostMapper.toDomain(post));
  }

  async update(id: number, payload: Partial<Post>): Promise<Post | null> {
    const entity = await this.postRepository.findOne({
      where: { id: id },
    });

    if (!entity) {
      return null;
    }

    // 1. Ubah payload domain (Partial<Post>) menjadi payload persistence
    const persistencePayload = PostMapper.toPersistence(payload as Post);

    // 2. Gabungkan, pastikan ID dari entity asli (DB) yang dipakai
    const updatedEntityPayload = {
      ...entity, // <-- Ambil semua nilai lama (termasuk ID yang benar)
      ...persistencePayload, // <-- Timpa dengan nilai baru
      id: entity.id, // <-- Pastikan ID-nya adalah ID yang lama (anti-gagal)
    };

    const updatedEntity = await this.postRepository.save(updatedEntityPayload);
    return PostMapper.toDomain(updatedEntity);
  }

  async softDelete(id: number): Promise<void> {
    await this.postRepository.softDelete(id);
  }
}
