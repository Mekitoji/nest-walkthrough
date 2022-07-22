import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Post } from './post.entity';
import { PostSearchBody } from './types/postSearchBody.interface';

@Injectable()
export class PostSearchService {
  private readonly index = 'posts';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  public async indexPost(post: Post): Promise<void> {
    await this.elasticsearchService.index<PostSearchBody>({
      index: this.index,
      body: {
        id: post.id,
        title: post.title,
        paragraphs: post.paragraphs,
        authorId: post.author.id,
      },
    });
  }

  private async count(query: string, fields: string[]): Promise<number> {
    const { count } = await this.elasticsearchService.count({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query,
            fields,
          },
        },
      },
    });

    return count;
  }

  public async search(
    text: string,
    offset?: number,
    limit?: number,
    startId?: number,
  ): Promise<{ count: number; results: PostSearchBody[] }> {
    let separateCount = 0;
    if (startId) {
      separateCount = await this.count(text, ['title', 'paragraphs']);
    }
    const { hits: hitsBody } =
      await this.elasticsearchService.search<PostSearchBody>({
        index: this.index,
        from: offset,
        size: limit,
        body: {
          query: {
            multi_match: {
              query: text,
              fields: ['title', 'paragraphs'],
            },
            range: {
              id: {
                gt: startId,
              },
            },
          },
          sort: {
            id: {
              order: 'asc',
            },
          },
        },
      });

    const { total: count, hits } = hitsBody;

    const results = hits.map((item) => item._source);

    return {
      count: startId ? separateCount : (count as number),
      results,
    };
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
      paragraphs: post.paragraphs,
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
        script,
      },
    });
  }
}
