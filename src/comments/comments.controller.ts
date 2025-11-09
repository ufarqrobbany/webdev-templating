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
  Request,
  Res,
  HttpCode,
  Req,
  HttpStatus, // <-- ADD
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
import { Response } from 'express';

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
  async create(
    @Request() req: { user: User }, // <-- MODIFIED: Get user from request
    @Body() createCommentDto: CreateCommentDto,
    @Res() res: Response,
  ) {
    await this.commentsService.create(req.user, createCommentDto);
    return res.redirect('/');
  }

  // v-- MODIFIED METHOD --v
  @Post(':commentId/replies')
  @HttpCode(HttpStatus.FOUND) // <-- 1. Tambah HttpCode
  async createReply(
    // <-- 2. Tambah async
    @Param('commentId') parentId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
    @Res() res: Response, // <-- 3. Inject @Res
  ): Promise<void> {
    // <-- 4. Ubah return type ke Promise<void>

    // 5. Tambah await
    await this.commentsService.createReply(
      req.user,
      parentId,
      createCommentDto.content,
    );

    // 6. Lakukan redirect
    return res.redirect('/');
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
