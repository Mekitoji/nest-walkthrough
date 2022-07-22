import { Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { FindManyOptions, In, MoreThan, Repository } from 'typeorm';
import { Post } from './post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostNotFoundException } from './exception/postNotFound.exception';
import { User } from '../users/user.entity';
import { PostSearchService } from './postsSearch.service';

type TPostSearchResponse = {
  items: Post[];
  count: number;
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private postSearchService: PostSearchService,
  ) {}

  public async getAllPosts(
    offset?: number,
    limit?: number,
    startId?: number,
  ): Promise<TPostSearchResponse> {
    const where: FindManyOptions<Post>['where'] = {};
    let separateCount = 0;
    if (startId) {
      where.id = MoreThan(startId);
      separateCount = await this.postRepository.count();
    }

    const [items, count] = await this.postRepository.findAndCount({
      where,
      relations: ['author'],
      order: { id: 'ASC' },
      skip: offset,
      take: limit,
    });

    return {
      items,
      count: startId ? separateCount : count,
    };
  }

  public async getPostById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (post) {
      return post;
    }

    throw new PostNotFoundException(id);
  }

  public async replacePost(id: number, post: UpdatePostDto): Promise<Post> {
    await this.postRepository.update(id, post);
    const updatedPost = await this.postRepository.findOne({ where: { id } });
    if (updatedPost) {
      await this.postSearchService.update(updatedPost);
      return updatedPost;
    }

    throw new PostNotFoundException(id);
  }

  public async createPost(post: CreatePostDto, user: User): Promise<Post> {
    const newPost = this.postRepository.create({
      ...post,
      author: user,
    });

    await this.postRepository.save(newPost);
    await this.postSearchService.indexPost(newPost);

    return newPost;
  }

  public async deletePost(id: number): Promise<void> {
    const deleteResponse = await this.postRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new PostNotFoundException(id);
    }
    await this.postSearchService.remove(id);
  }

  public async searchForPosts(
    text: string,
    offset?: number,
    limit?: number,
    startId?: number,
  ): Promise<TPostSearchResponse> {
    const { results, count } = await this.postSearchService.search(
      text,
      offset,
      limit,
      startId,
    );
    const ids = results.map((result: { id: number }) => result.id);
    if (!ids.length) {
      return { items: [], count };
    }

    const items = await this.postRepository.find({
      where: { id: In(ids) },
    });

    return { items, count };
  }

  public async getPostsWithParagraph(paragraph: string): Promise<Post[]> {
    return this.postRepository.query(
      'SELECT * from post WHERE $1 = ANY(paragraphs)',
      [paragraph],
    );
  }
}
