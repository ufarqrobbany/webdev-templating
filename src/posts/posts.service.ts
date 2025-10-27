import {
  Inject,
  Injectable,
  UnprocessableEntityException, // <-- 1. IMPORT
  HttpStatus, // <-- 2. IMPORT
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { FindAllPostsDto } from './dto/find-all-posts.dto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';

import { User } from 'src/users/domain/user';
import { Post } from './domain/post';
import { FilesService } from 'src/files/files.service'; // <-- 3. IMPORT
import { FileType } from 'src/files/domain/file'; // <-- 4. IMPORT

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostRepository)
    private readonly postRepository: PostRepository,
    private readonly filesService: FilesService, // <-- 5. INJECT
  ) {}

  // v-- 6. GANTI SELURUH FUNGSI 'create' --v
  async create(user: User, createPostDto: CreatePostDto) {
    const postDomain = new Post();

    // v-- PERBAIKAN DI SINI --v
    
    // 1. Assign content HANYA jika ada, jika tidak, pastikan null
    postDomain.content = createPostDto.content ? createPostDto.content : null;
    postDomain.author = user;

    let photo: FileType | null = null;
    
    // 2. Pastikan kita HANYA memproses jika 'photo.id' benar-benar ada
    if (createPostDto.photo?.id) { 
      const fileObject = await this.filesService.findById(
        createPostDto.photo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            photo: 'imageNotExists',
          },
        });
      }
      photo = fileObject;
    }
    
    // 3. Assign foto (yang sudah pasti 'null' atau berisi FileType)
    postDomain.photo = photo;
    // ^-- AKHIR PERBAIKAN --^

    return this.postRepository.create(postDomain);
  }
  // ^-- AKHIR PERUBAHAN FUNGSI 'create' --^

  findAll({
    filterOptions,
    paginationOptions,
    currentUser,
    authorId,
  }: {
    filterOptions?: FindAllPostsDto | null;
    paginationOptions: IPaginationOptions;
    currentUser?: User | null;
    authorId?: number | string; 
  }) {
    let followingUserIds: (number | string)[] | undefined = undefined;

    // Logika followingUserIds hanya relevan jika authorId TIDAK ADA (timeline)
    if (!authorId && currentUser) {
      followingUserIds = [];
      if (currentUser.following && currentUser.following.length > 0) {
        followingUserIds.push(
          ...currentUser.following.map((user) => user.id),
        );
      }
      followingUserIds.push(currentUser.id);
    }

    return this.postRepository.findAll({
      filterOptions,
      paginationOptions,
      followingUserIds, // Akan undefined jika authorId ada
      authorId,
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
