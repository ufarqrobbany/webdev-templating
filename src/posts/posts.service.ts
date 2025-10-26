import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { FindAllPostsDto } from './dto/find-all-posts.dto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostRepository)
    private readonly postRepository: PostRepository,
  ) {}

  create(createPostDto: CreatePostDto) {
    return this.postRepository.create(createPostDto);
  }

  findAll({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllPostsDto | null;
    paginationOptions: IPaginationOptions;
  }) {
    return this.postRepository.findAll({
      filterOptions,
      paginationOptions,
    });
  }

  findOne(id: number) { 
    return this.postRepository.findOne(id);
  }

  update(
    id: number, 
    updatePostDto: UpdatePostDto
  ) {
    return this.postRepository.update(id, updatePostDto);
  }

  remove(id: number) {
    return this.postRepository.softDelete(id); 
  }
}