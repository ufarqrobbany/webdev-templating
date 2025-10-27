import {
  Inject,
  Injectable,
  UnprocessableEntityException, // <-- 1. IMPORT
  HttpStatus,
  NotFoundException, // <-- 2. IMPORT
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
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './infrastructure/persistence/relational/entities/post.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostRepository)
    private readonly postRepository: PostRepository,
    private readonly filesService: FilesService, // <-- 5. INJECT
    @InjectRepository(PostEntity) // <-- ADD
    private readonly postEntityRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity) // <-- ADD
    private readonly userEntityRepository: Repository<UserEntity>,
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

  async like(postId: number, userId: User['id']): Promise<void> {
    const [post, user] = await Promise.all([
      this.postEntityRepository.findOne({
        where: { id: postId },
        relations: ['likedBy'],
      }),
      this.userEntityRepository.findOne({
        where: { id: Number(userId) },
      }),
    ]);

    if (!post || !user) {
      throw new NotFoundException('Post or User not found.');
    }

    const isAlreadyLiked = post.likedBy.some(
      (likedUser) => likedUser.id === user.id,
    );

    if (isAlreadyLiked) {
      return; // Already liked, do nothing
    }

    post.likedBy.push(user);
    post.likesCount = (post.likesCount || 0) + 1; // Ensure likesCount is a number
    await this.postEntityRepository.save(post);
  }

  async unlike(postId: number, userId: User['id']): Promise<void> {
    const post = await this.postEntityRepository.findOne({
      where: { id: postId },
      relations: ['likedBy'],
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const initialLikeCount = post.likedBy.length;
    post.likedBy = post.likedBy.filter(
      (likedUser) => likedUser.id !== Number(userId),
    );
    const finalLikeCount = post.likedBy.length;

    // Only update count if a user was actually removed
    if (initialLikeCount > finalLikeCount) {
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1); // Decrement, ensure not negative
      await this.postEntityRepository.save(post);
    }
  }
}
