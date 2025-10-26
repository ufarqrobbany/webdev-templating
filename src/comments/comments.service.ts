import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentRepository } from './infrastructure/persistence/comment.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Comment } from './domain/comment';
import { User } from '../users/domain/user'; // <-- ADD
import { Post } from '../posts/domain/post'; // <-- ADD
import { FindAllCommentsDto } from './dto/find-all-comments.dto'; // <-- ADD

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

  remove(id: Comment['id']) {
    return this.commentRepository.softDelete(id); // <-- MODIFIED: Call 'softDelete'
  }
}
