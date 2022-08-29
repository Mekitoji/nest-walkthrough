import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { CreateCommentCommand } from './create-comment.command';
import { Comment } from '../comment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async execute(command: CreateCommentCommand): Promise<Comment> {
    const { comment, author } = command;

    const newPost = this.commentsRepository.create({
      ...comment,
      author,
    });

    await this.commentsRepository.save(newPost);

    return newPost;
  }
}
