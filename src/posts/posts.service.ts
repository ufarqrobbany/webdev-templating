import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostRepository } from './infrastructure/persistence/post.repository';
import { FindAllPostsDto } from './dto/find-all-posts.dto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { User } from 'src/users/domain/user';
import { Post } from './domain/post';
import { FileType } from 'src/files/domain/file';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './infrastructure/persistence/relational/entities/post.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { Express } from 'express';

// v-- PERBAIKAN 1: Ganti nama import service --v
import { FilesS3Service } from 'src/files/infrastructure/uploader/s3/files.service';
// ^-- Nama class-nya 'FilesLocalService', bukan 'LocalFilesService' --^

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostRepository)
    private readonly postRepository: PostRepository,
    // v-- PERBAIKAN 2: Ganti nama class yang di-inject --v
    private readonly filesService: FilesS3Service,
    // ^-- Sesuaikan dengan import di atas --^
    @InjectRepository(PostEntity)
    private readonly postEntityRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {}

  async create(
    user: User,
    createPostDto: CreatePostDto,
    file: Express.MulterS3.File | undefined,
  ): Promise<Post> {
    if (!createPostDto.content && !file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          content: 'Post cannot be empty. Please provide text or upload a file.',
        },
      });
    }

    const postDomain = new Post();
    let photo: FileType | null = null;

    if (file) {
      // v-- PERBAIKAN 3: Ganti nama method dan cara ambil return value --v
      // Method di FilesLocalService namanya 'create'
      const uploadedFile = await this.filesService.create(file);
      // Dan return value-nya adalah objek { file: FileType }
      photo = uploadedFile.file;
      // ^-- AKHIR PERBAIKAN 3 --^
    }

    postDomain.content = createPostDto.content || null;
    postDomain.author = user;
    postDomain.photo = photo;

    return this.postRepository.create(postDomain);
  }

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
      // Cek apakah user mem-follow seseorang
      if (currentUser.following && currentUser.following.length > 0) {
        // KASUS 1: User SUDAH follow orang.
        // Tampilkan postingan dari orang yang di-follow + diri sendiri.
        followingUserIds = [];
        followingUserIds.push(
          ...currentUser.following.map((user) => user.id),
        );
        followingUserIds.push(currentUser.id);
      } else {
        // KASUS 2: User BELUM follow siapa pun.
        // Biarkan followingUserIds = undefined agar repository mengambil SEMUA postingan.
        followingUserIds = undefined;
      }
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
      return;
    }

    post.likedBy.push(user);
    post.likesCount = (post.likesCount || 0) + 1;
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

    if (initialLikeCount > finalLikeCount) {
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
      await this.postEntityRepository.save(post);
    }
  }
}