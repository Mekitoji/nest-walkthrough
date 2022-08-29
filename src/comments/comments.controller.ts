import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import { RequestWithUser } from '../authentication/interfaces/requestWithUser.interface';
import { CreateCommentCommand } from './commands/create-comment.command';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comments.dto';
import { GetCommentQuery } from './queries/get-comment.query';

@Controller('comments')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentsController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  async createComment(
    @Body() comment: CreateCommentDto,
    @Req() req: RequestWithUser,
  ) {
    const { user } = req;
    return this.commandBus.execute(new CreateCommentCommand(comment, user));
  }

  @Get()
  async GetComment(@Query() { postId }: GetCommentDto) {
    return this.queryBus.execute(new GetCommentQuery(postId));
  }
}
