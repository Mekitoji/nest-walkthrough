import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import { FindOneParams } from '../utils/findOneParams';
import { RequestWithUser } from '../authentication/interfaces/requestWithUser.interface';

@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id')
  public async getPostById(@Param('id', ParseIntPipe) { id }: FindOneParams) {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  public async createPost(
    @Body() post: CreatePostDto,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.createPost(post, req.user);
  }

  @Put(':id')
  public async replacePost(
    @Param('id', ParseIntPipe) { id }: FindOneParams,
    @Body() post: UpdatePostDto,
  ) {
    return this.postsService.replacePost(id, post);
  }

  @Delete(':id')
  public async deletePost(@Param('id', ParseIntPipe) { id }: FindOneParams) {
    return this.postsService.deletePost(id);
  }

  @Get()
  public async getPosts(@Query('search') search: string) {
    if (search) {
      return this.postsService.searchForPosts(search);
    }
    return this.postsService.getAllPosts();
  }
}
