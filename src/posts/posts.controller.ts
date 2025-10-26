import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FindAllPostsDto } from './dto/find-all-posts.dto';
import { PostDto } from './dto/post.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from 'src/utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from 'src/utils/infinity-pagination';
import { AuthGuard } from '@nestjs/passport';

// HAPUS IMPORT INI (jika ada):
// import { Post } from './domain/post';

@ApiTags('Posts')
@Controller({
  path: 'posts',
  version: '1',
})
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt')) // <-- Menjaga endpoint ini (opsional tapi disarankan)
  @Post() // <-- Ini decorator, biarkan
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPostDto: CreatePostDto, 
    @Request() req,
    ): Promise<PostDto> {
    const user = req.user;
    return this.postsService.create(user, createPostDto);;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: InfinityPaginationResponse(PostDto), // <--- UBAH INI
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: FindAllPostsDto,
  ): Promise<InfinityPaginationResponseDto<PostDto>> { // <--- UBAH INI
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
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PostDto | null> { // <--- UBAH INI
    return this.postsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt')) // <-- Menjaga endpoint ini
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number, // <--- UBAH INI
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto | null> { // <--- UBAH TIPE RETURN
    // Nanti kita tambahkan cek kepemilikan post di sini
    return this.postsService.update(id, updatePostDto);
  }

  @UseGuards(AuthGuard('jwt')) // <-- Menjaga endpoint ini
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> { // <--- UBAH INI
    // Nanti kita tambahkan cek kepemilikan post di sini
    return this.postsService.remove(id);
  }
}