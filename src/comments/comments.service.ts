import {
  // common
  Injectable,
  NotFoundException, // <-- ADD
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentRepository } from './infrastructure/persistence/comment.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Comment } from './domain/comment';
import { User } from '../users/domain/user';
import { Post } from '../posts/domain/post';
import { FindAllCommentsDto } from './dto/find-all-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    // Dependencies here
    private readonly commentRepository: CommentRepository,
  ) {}

  async create(
    user: User,
    createCommentDto: CreateCommentDto,
  ) {
    // Do not remove comment below.
    // <creating-property />

    const comment = new Comment();
    comment.content = createCommentDto.content;
    comment.author = user;
    comment.post = { id: createCommentDto.postId } as Post; // <-- This will now work

    if (createCommentDto.parentId) { // <-- This will now work
      comment.parent = { id: createCommentDto.parentId } as Comment; // <-- This will now work
    }

    return this.commentRepository.create(comment);
  }

  // v-- ADD THIS METHOD --v
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
  // ^-- END OF NEW METHOD --^

  findAllWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllCommentsDto | null;
    paginationOptions: IPaginationOptions;
  }) {
    return this.commentRepository.findAll({
      filterOptions,
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Comment['id']) {
    return this.commentRepository.findOne(id);
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
      content: updateCommentDto.content,
    });
  }

  remove(id: Comment['id']) {
    return this.commentRepository.softDelete(id);
  }
}