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
  DefaultValuePipe,
  ParseIntPipe,
  Request,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Response } from 'express';
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
import { User } from '../users/domain/user';

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
  @ApiCreatedResponse({ type: Comment })
  @HttpCode(HttpStatus.FOUND)
  async create(
    @Request() req: { user: User },
    @Body() createCommentDto: CreateCommentDto,
    @Res() res: Response,
  ) {
    await this.commentsService.create(req.user, createCommentDto);
    return res.redirect('/');
  }

  // v-- MODIFIED METHOD --v
  @Post(':commentId/replies')
  @HttpCode(HttpStatus.FOUND) // <-- 1. Tambah HttpCode
  async createReply( // <-- 2. Tambah async
    @Param('commentId') parentId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
    @Res() res: Response, // <-- 3. Inject @Res
  ): Promise<void> { // <-- 4. Ubah return type ke Promise<void>
    
    // 5. Tambah await
    await this.commentsService.createReply(
      req.user,
      parentId,
      createCommentDto.content,
    );

    // 6. Lakukan redirect
    return res.redirect('/');
  }
  // ^-- END OF MODIFICATION --^

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Comment),
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: FindAllCommentsDto,
  ): Promise<InfinityPaginationResponseDto<Comment>> {
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.commentsService.findAllWithPagination({
        filterOptions: filter,
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
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    type: Comment,
  })
  findById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  @ApiOkResponse({
    type: Comment,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.remove(id);
  }
}