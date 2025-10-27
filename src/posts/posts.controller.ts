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
  Query, // <-- Tambah Query
  DefaultValuePipe, // <-- Tambah DefaultValuePipe
  ParseIntPipe, // <-- Tetap ada
  Param, // <-- Tambah Param
  Res, // <-- 1. TAMBAH Res
} from '@nestjs/common';
import { Response } from 'express'; // <-- 2. TAMBAH Response
import { PostsService } from './posts.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
// Ganti DTO jika nama aslinya beda
import { FindAllPostsDto } from './dto/find-all-posts.dto';
// Ganti DTO jika nama aslinya beda
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
  // 3. Modifikasi: Tambah @Res, return jadi Promise<void>
  async create(
    @Body() createPostDto: CreatePostDto,
    @Request() req,
    @Res() res: Response, // Inject Response
  ): Promise<void> {
    // Return void
    const user = req.user; // Ambil user dari request
    // Panggil service create (asumsi return PostDto tapi kita abaikan)
    await this.postsService.create(user as User, createPostDto);

    // 4. Redirect ke homepage
    return res.redirect('/');
  }

  // --- BAGIAN BAWAH INI KEMBALI KE KODE ASLI LO ---
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: InfinityPaginationResponse(PostDto),
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: FindAllPostsDto, // Tetap pake filter FindAllPostsDto
  ): Promise<InfinityPaginationResponseDto<PostDto>> {
    if (limit > 50) {
      limit = 50;
    }

    // Panggil service findAll sesuai kode asli lo
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
    // Tambahkan @Request req jika service update butuh user
    // @Request() req,
  ): Promise<PostDto | null> {
    // Panggil service update sesuai kode asli lo
    // Jika service butuh user, tambahkan req.user:
    // return this.postsService.update(id, req.user, updatePostDto);
    return this.postsService.update(id, updatePostDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    // Tambahkan @Request req jika service remove butuh user
    // @Request() req,
  ): Promise<void> {
    // Panggil service remove sesuai kode asli lo
    // Jika service butuh user, tambahkan req.user:
    // return this.postsService.remove(id, req.user);
    return this.postsService.remove(id);
  }

 // ... (imports)

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
    return res.redirect('/'); // <-- UBAH KE '/'
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
    return res.redirect('/'); // <-- UBAH KE '/'
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
