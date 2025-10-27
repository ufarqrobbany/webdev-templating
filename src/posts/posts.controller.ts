import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  UseGuards,
  Patch,
  Delete,
  SerializeOptions,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
  Res,
  UseInterceptors, // <-- TAMBAHAN
  UploadedFile, // <-- TAMBAHAN
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express'; // <-- TAMBAHAN
import { Express } from 'express'; // <-- TAMBAHAN (PENTING)
import { PostsService } from './posts.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { FindAllPostsDto } from './dto/find-all-posts.dto';
import { PostDto } from './dto/post.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from 'src/utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from 'src/utils/infinity-pagination';
import { NullableType } from 'src/utils/types/nullable.type'; // Import NullableType
import { User } from 'src/users/domain/user'; // Import User
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

@ApiTags('Posts')
@Controller({
  path: 'posts',
  version: '1',
})
export class PostsController {
  constructor(private readonly postsService: PostsService, private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file')) // <-- TAMBAHAN: Untuk mem-parsing multipart/form-data
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File, // <-- TAMBAHAN: Untuk menangkap file
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as User;

    // Panggil service create dengan tambahan 'file'
    // Pastikan service Anda sudah diupdate untuk menerima 'file'
    await this.postsService.create(user, createPostDto, file); // <-- MODIFIKASI: tambahkan 'file'

    // Redirect ke homepage
    return res.redirect('/');
  }

  // --- BAGIAN BAWAH INI SAMA SEPERTI KODE ASLI ANDA ---

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: InfinityPaginationResponse(PostDto),
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: FindAllPostsDto,
  ): Promise<InfinityPaginationResponseDto<PostDto>> {
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.postsService.findAll({
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
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PostDto | null> {
    return this.postsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto | null> {
    return this.postsService.update(id, updatePostDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.postsService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/like')
  @HttpCode(HttpStatus.FOUND)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    await this.postsService.like(id, req.user.id);
    return res.redirect('/');
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/unlike')
  @HttpCode(HttpStatus.FOUND)
  async unlike(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    await this.postsService.unlike(id, req.user.id);
    return res.redirect('/');
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  @HttpCode(HttpStatus.FOUND)
  async createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Request() req,
    @Body() createCommentDto: CreateCommentDto, // DTO ini hanya akan berisi 'content' dari form
    @Res() res: Response,
  ): Promise<void> {
    await this.commentsService.create(req.user, {
      ...createCommentDto,
      postId: postId, // Ambil postId dari URL
    });
    return res.redirect('/');
  }
}
