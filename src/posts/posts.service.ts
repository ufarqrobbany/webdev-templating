import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { FindAllPostsDto } from './dto/find-all-posts.dto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';

import { User } from 'src/users/domain/user';
import { Post } from './domain/post';

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostRepository)
    private readonly postRepository: PostRepository,
  ) {}

  create(user: User, createPostDto: CreatePostDto) {
    const postDomain = new Post();
    postDomain.content = createPostDto.content;
    postDomain.author = user;

    return this.postRepository.create(postDomain);
  }

  findAll({
    filterOptions,
    paginationOptions,
    currentUser,
  }: {
    filterOptions?: FindAllPostsDto | null;
    paginationOptions: IPaginationOptions;
    currentUser?: User | null;
  }) {
    let followingUserIds: (number | string)[] | undefined = undefined;

    // Jika ada user yang login
    if (currentUser) {
      // Mulai dengan array kosong (hanya akan menampilkan postingan yang di-follow)
      followingUserIds = [];

      // Jika dia mem-follow seseorang
      if (currentUser.following && currentUser.following.length > 0) {
        followingUserIds.push(...currentUser.following.map((user) => user.id));
      }
      // Tambahkan ID user itu sendiri agar postingannya juga muncul
      followingUserIds.push(currentUser.id);
    }

    // Jika currentUser null (anonim), followingUserIds akan tetap 'undefined'
    // dan repository akan mengambil semua postingan

    return this.postRepository.findAll({
      filterOptions,
      paginationOptions,
      followingUserIds,
    });
  }

  findOne(id: number) {
    return this.postRepository.findOne(id);
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return this.postRepository.update(id, updatePostDto);
  }

  remove(id: number) {
    return this.postRepository.softDelete(id);
  }
}
