import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../comment.entity';
import { GetCommentQuery } from './get-comment.query';

@QueryHandler(GetCommentQuery)
export class GetCommentHandler implements IQueryHandler<GetCommentQuery> {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async execute(query: GetCommentQuery): Promise<Comment[]> {
    if (query.postId) {
      return this.commentsRepository.find({
        where: {
          post: {
            id: query.postId,
          },
        },
      });
    }

    return [];
  }
}
