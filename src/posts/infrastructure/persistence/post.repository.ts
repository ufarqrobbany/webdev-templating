// src/posts/infrastructure/persistence/post.repository.ts

import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Post } from '../../domain/post';
import { FindAllPostsDto } from '../../dto/find-all-posts.dto'; // <-- DITAMBAHKAN

export abstract class PostRepository {
  abstract create(
    data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, // <-- 'deletedAt' ditambahkan
  ): Promise<Post>;

  abstract findAll({
    filterOptions,
    paginationOptions,
    followingUserIds,
  }: {
    filterOptions?: FindAllPostsDto | null;
    paginationOptions: IPaginationOptions;
    followingUserIds?: (number | string)[];
  }): Promise<Post[]>;

  abstract findOne(id: number): Promise<NullableType<Post>>;

  abstract findByIds(ids: number[]): Promise<Post[]>;

  abstract update(
    id: number, 
    payload: DeepPartial<Post>,
  ): Promise<Post | null>;

  abstract softDelete(id: number): Promise<void>; 
}