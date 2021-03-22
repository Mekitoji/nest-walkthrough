import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Test, TestingModule } from '@nestjs/testing';
import { MockType } from '../utils/mocks/mockType';
import { mockedPost } from './mocks/post.mock';
import { mockedSearchPost1, mockedSearchPost2 } from './mocks/searchPost.mock';
import { Post } from './post.entity';
import { PostSearchService } from './postsSearch.service';
import { PostSearchResult } from './types/postSearchResult.interface';

describe('PostSearchService', () => {
  let service: PostSearchService;
  let elasticsearchService: MockType<ElasticsearchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostSearchService,
        {
          provide: ElasticsearchService,
          useValue: {
            index: jest.fn(),
            search: jest.fn(),
            deleteByQuery: jest.fn(),
            updateByQuery: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostSearchService>(PostSearchService);
    elasticsearchService = module.get(ElasticsearchService);
  });

  describe('when indexing post', () => {
    let post: Post;
    beforeEach(() => {
      post = mockedPost;
      elasticsearchService.index.mockResolvedValue({});
    });
    it('expect to not not throw errors', async () => {
      await expect(service.indexPost(post)).resolves.toEqual(undefined);
    });
  });

  describe('when search post by text', () => {
    let text: string;
    const post1 = mockedSearchPost1;
    const post2 = mockedSearchPost2;
    let hits = [];

    it('expect to find posts with text', async () => {
      text = 'some text';
      hits = [
        {
          _source: post1,
        },
        {
          _source: post2,
        },
      ];

      const searchResult: PostSearchResult = {
        hits: {
          total: 3,
          hits,
        },
      };
      const expected = [post1, post2];

      const spy = jest
        .spyOn(elasticsearchService, 'search')
        .mockResolvedValue({ body: searchResult });

      await expect(service.search(text)).resolves.toEqual(expected);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when deleting post', () => {
    it('expect to return nothing', async () => {
      const spy = jest
        .spyOn(elasticsearchService, 'deleteByQuery')
        .mockResolvedValue(undefined);
      const id = 1;
      await expect(service.remove(id)).resolves.toEqual(undefined);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when updating post', () => {
    const post = mockedPost;
    it('expect to resolve', async () => {
      const spy = jest.spyOn(elasticsearchService, 'updateByQuery');
      await expect(service.update(post)).resolves.toEqual(undefined);
      expect(spy).toHaveBeenCalled();
    });
  });
});
