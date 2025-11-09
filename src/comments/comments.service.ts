import {
  // common
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentRepository } from './infrastructure/persistence/comment.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Comment } from './domain/comment';
import { User } from '../users/domain/user'; // <-- ADD
import { Post } from '../posts/domain/post'; // <-- ADD
import { FindAllCommentsDto } from './dto/find-all-comments.dto'; // <-- ADD
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class CommentsService {
  constructor(
    // Dependencies here
    private readonly commentRepository: CommentRepository,
  ) {}

  async create(
    user: User, // <-- MODIFIED: Accept user
    createCommentDto: CreateCommentDto,
  ) {
    // Do not remove comment below.
    // <creating-property />

    // v-- MODIFIED: Create and populate domain entity --v
    const comment = new Comment();
    comment.content = createCommentDto.content;
    comment.author = user;
    comment.post = { id: createCommentDto.postId } as Post;

    if (createCommentDto.parentId) {
      comment.parent = { id: createCommentDto.parentId } as Comment;
    }
    // ^-- MODIFIED --^

    return this.commentRepository.create(comment); // <-- MODIFIED: Pass comment
  }

  findAllWithPagination({
    filterOptions, // <-- MODIFIED: Accept filterOptions
    paginationOptions,
  }: {
    filterOptions?: FindAllCommentsDto | null; // <-- MODIFIED
    paginationOptions: IPaginationOptions;
  }) {
    return this.commentRepository.findAll({
      // <-- MODIFIED: Call 'findAll'
      filterOptions, // <-- MODIFIED: Pass filterOptions
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Comment['id']) {
    return this.commentRepository.findOne(id); // <-- MODIFIED: Call 'findOne'
  }

  findByIds(ids: Comment['id'][]) {
    return this.commentRepository.findByIds(ids);
  }

  async update(id: Comment['id'], updateCommentDto: UpdateCommentDto) {
    // Do not remove comment below.
    // <updating-property />

    return this.commentRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      content: updateCommentDto.content, // <-- MODIFIED: Pass update payload
    });
  }

  async remove(id: number, user: User): Promise<void> {
    const comment = await this.commentRepository.findOne(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAdmin = user.role?.id === RoleEnum.admin;
    const isAuthor = comment.author.id === user.id;

    if (!isAuthor && !isAdmin) {
      // Jika bukan penulis DAN bukan admin, lempar error
      throw new UnauthorizedException('You are not authorized to delete this comment');
    }

    return this.commentRepository.softDelete(id);
  }

  async createReply(
    user: User, // <-- Pass full user object
    parentId: number,
    content: string,
  ): Promise<Comment> {
    // 1. Find the parent comment
    const parentComment = await this.commentRepository.findOne(parentId);
    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    // 2. Get the postId from the parent
    const postId = parentComment.post.id;

    // 3. Create the DTO for the 'create' method
    const createCommentDto: CreateCommentDto = {
      content,
      postId,
      parentId,
    };

    // 4. Call the existing 'create' method
    return this.create(user, createCommentDto);
  }
}
