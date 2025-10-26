import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe, // <-- ADD
  ParseIntPipe, // <-- ADD
  Request, // <-- ADD
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Comment } from './domain/comment';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllCommentsDto } from './dto/find-all-comments.dto';
import { User } from '../users/domain/user'; // <-- ADD

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'comments',
  version: '1',
})
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Comment,
  })
  create(
    @Request() req: { user: User }, // <-- MODIFIED: Get user from request
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user, createCommentDto); // <-- MODIFIED: Pass user
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Comment),
  })
  async findAll(
    // v-- MODIFIED: Extract page, limit, and filter separately --v
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: FindAllCommentsDto,
    // ^-- MODIFIED --^
  ): Promise<InfinityPaginationResponseDto<Comment>> {
    // const page = query?.page ?? 1; // <-- REMOVE
    // let limit = query?.limit ?? 10; // <-- REMOVE
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.commentsService.findAllWithPagination({
        filterOptions: filter, // <-- MODIFIED: Pass filter
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number, // <-- MODIFIED: Change type to Number
    required: true,
  })
  @ApiOkResponse({
    type: Comment,
  })
  findById(
    @Param('id', ParseIntPipe) id: number, // <-- MODIFIED: Add ParseIntPipe
  ) {
    return this.commentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number, // <-- MODIFIED: Change type to Number
    required: true,
  })
  @ApiOkResponse({
    type: Comment,
  })
  update(
    @Param('id', ParseIntPipe) id: number, // <-- MODIFIED: Add ParseIntPipe
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number, // <-- MODIFIED: Change type to Number
    required: true,
  })
  remove(
    @Param('id', ParseIntPipe) id: number, // <-- MODIFIED: Add ParseIntPipe
  ) {
    return this.commentsService.remove(id);
  }
}
