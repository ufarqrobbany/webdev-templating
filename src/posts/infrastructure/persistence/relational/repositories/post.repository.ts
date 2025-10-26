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
  }: {
    filterOptions?: FindAllPostsDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Post[]> {
    const entities = await this.postRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
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
      where: ids.map(id => ({ id })) 
    });
    return entities.map((post) => PostMapper.toDomain(post));
  }

  async update(
    id: number,
    payload: Partial<Post>,
  ): Promise<Post | null> {
    const entity = await this.postRepository.findOne({
      where: { id: id },
    });

    if (!entity) {
      return null; 
    }

    const updatedPayload = {
      ...entity,
      ...payload,
    };

    const updatedEntity = await this.postRepository.save(updatedPayload);
    return PostMapper.toDomain(updatedEntity);
  }

  async softDelete(id: number): Promise<void> {
    await this.postRepository.softDelete(id);
  }
}
