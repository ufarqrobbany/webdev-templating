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
  Res,
  HttpCode,
  Req,
  HttpStatus,
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
import { User } from '../users/domain/user';
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
    @Request() req: { user: User },
    @Body() createCommentDto: CreateCommentDto,
    @Res() res: Response,
  ) {
    await this.commentsService.create(req.user, createCommentDto);
    return res.redirect('/');
  }

  @Post(':commentId/replies')
  @HttpCode(HttpStatus.FOUND)
  async createReply(
    @Param('commentId') parentId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    await this.commentsService.createReply(
      req.user,
      parentId,
      createCommentDto.content,
    );
    return res.redirect('/');
  }

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
  findById(@Param('id', ParseIntPipe) id: number) {
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

  @Delete(':id/delete')
  @HttpCode(HttpStatus.FOUND)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    await this.commentsService.remove(id, req.user);

    return res.redirect('/');
  }
}
