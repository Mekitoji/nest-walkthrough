import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Post } from './post.entity';
import { PostSearchBody } from './types/postSearchBody.interface';
import { PostSearchResult } from './types/postSearchResult.interface';

@Injectable()
export class PostSearchService {
  private readonly index = 'posts';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  public async indexPost(post: Post): Promise<void> {
    await this.elasticsearchService.index<PostSearchResult, PostSearchBody>({
      index: this.index,
      body: {
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author.id,
      },
    });
  }

  public async search(text: string) {
    const { body } = await this.elasticsearchService.search<PostSearchResult>({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query: text,
            fields: ['title', 'content'],
          },
        },
      },
    });

    const hits = body.hits.hits;

    return hits.map((item) => item._source);
  }

  public async remove(postId: number): Promise<void> {
    this.elasticsearchService.deleteByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            id: postId,
          },
        },
      },
    });
  }

  public async update(post: Post): Promise<void> {
    const newPost: PostSearchBody = {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author.id,
    };

    const script: string = Object.entries(newPost).reduce(
      (result, [key, value]) => {
        return `${result} ctx._source=${key}=${value}`;
      },
      '',
    );
    await this.elasticsearchService.updateByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            id: post.id,
          },
        },
        script: {
          inline: script,
        },
      },
    });
  }
}
