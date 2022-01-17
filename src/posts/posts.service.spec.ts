import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { MockType } from '../utils/mocks/mockType';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { mockedSearchPost1, mockedSearchPost2 } from './mocks/searchPost.mock';
import { Post } from './post.entity';
import { PostsService } from './posts.service';
import { PostSearchService } from './postsSearch.service';

describe('PostsService', () => {
  let service: PostsService;
  let mockedPostRepository: MockType<Repository<Post>>;
  let mockedSearchService: MockType<PostSearchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostSearchService,
          useValue: {
            indexPost: jest.fn(),
            search: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    mockedPostRepository = module.get(getRepositoryToken(Post));
    mockedSearchService = module.get(PostSearchService);
  });

  describe('when getting all posts', () => {
    let posts: Post[];
    beforeEach(() => {
      mockedPostRepository.find.mockResolvedValue(posts);
    });
    it('expect to return array of it', async () => {
      await expect(service.getAllPosts()).resolves.toEqual(posts);
    });
  });

  describe('when getting post by id', () => {
    describe('and it was found', () => {
      let post: Post;
      beforeEach(() => {
        post = {
          id: 1,
          title: 'title',
          paragraphs: ['paragraph1', 'paragraph2'],
          categories: [],
        };
        mockedPostRepository.findOne.mockResolvedValue(post);
      });

      it('expect to return a posts', async () => {
        const id = 1;
        await expect(service.getPostById(id)).resolves.toEqual(post);
      });
    });

    describe('and post with this id do not exist', () => {
      beforeEach(() => {
        mockedPostRepository.findOne.mockResolvedValue(undefined);
      });
      it('expect to throw an error', async () => {
        const id = 321;
        await expect(service.getPostById(id)).rejects.toThrow();
      });
    });
  });

  describe('when updating a post by id', () => {
    describe('and it was found', () => {
      let post: Post;
      let newPost: UpdatePostDto;
      beforeEach(() => {
        post = {
          id: 1,
          title: 'title',
          paragraphs: ['paragraph1', 'paragraph2'],
          categories: [],
        };
        newPost = {
          id: 1,
          title: 'title',
          paragraphs: ['paragraph1', 'paragraph2'],
        };
        mockedPostRepository.update.mockResolvedValue({});
        mockedPostRepository.findOne.mockResolvedValue(post);
      });
      it('expect to return updated post', async () => {
        const id = 1;
        const spy = jest.spyOn(mockedSearchService, 'update');
        await expect(service.replacePost(id, newPost)).resolves.toEqual(post);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('and post not found', () => {
      let newPost: UpdatePostDto;
      beforeEach(() => {
        newPost = {
          id: 1,
          title: 'title',
          paragraphs: ['paragraph1', 'paragraph2'],
        };
        mockedPostRepository.update.mockResolvedValue({});
        mockedPostRepository.findOne.mockResolvedValue(undefined);
      });
      it('expect to throw an error', async () => {
        const spy = jest.spyOn(mockedSearchService, 'update');
        const id = 3241;
        await expect(service.replacePost(id, newPost)).rejects.toThrow();
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('when attempt to create new post', () => {
    let newPost: CreatePostDto;
    let user: User;
    beforeEach(() => {
      user = new User();
      newPost = {
        title: 'title',
        paragraphs: ['paragraph1', 'paragraph2'],
      };
      mockedPostRepository.create.mockResolvedValue({
        ...newPost,
        author: user,
        id: 1,
      });
      mockedPostRepository.save.mockResolvedValue(true);
    });
    it('expect to return new post', async () => {
      const spy = jest.spyOn(mockedSearchService, 'indexPost');
      const expected = { ...newPost, author: user, id: 1 };
      await expect(service.createPost(newPost, user)).resolves.toEqual(
        expected,
      );
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('when attempt to delete new post', () => {
    describe('and operation succesfully completed', () => {
      beforeEach(() => {
        mockedPostRepository.delete.mockResolvedValue({ affected: true });
      });
      it('expect to resolves without error', async () => {
        const spy = jest.spyOn(mockedSearchService, 'remove');
        const id = 1;
        await expect(service.deletePost(id)).resolves.not.toThrow();
        expect(spy).toHaveBeenCalled();
      });
    });
    describe('and post not found', () => {
      beforeEach(() => {
        mockedPostRepository.delete.mockResolvedValue({ affected: false });
      });
      it('expect to throw an error', async () => {
        const spy = jest.spyOn(mockedSearchService, 'remove');
        const id = 3341;
        await expect(service.deletePost(id)).rejects.toThrow();
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('when search for post by text', () => {
    const text = 'some text query';

    it('expect to return an empty error if search return empty result', async () => {
      const spySearch = jest
        .spyOn(mockedSearchService, 'search')
        .mockResolvedValue([]);
      const spyFind = jest.spyOn(mockedPostRepository, 'find');
      await expect(service.searchForPosts(text)).resolves.toEqual([]);
      expect(spySearch).toHaveBeenCalled();
      expect(spyFind).not.toHaveBeenCalled();
    });

    it('expect to return an array of posts', async () => {
      const posts = [mockedSearchPost1, mockedSearchPost2];
      const spySearch = jest
        .spyOn(mockedSearchService, 'search')
        .mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const spyFind = jest
        .spyOn(mockedPostRepository, 'find')
        .mockResolvedValue(posts);
      const expected = [mockedSearchPost1, mockedSearchPost2];
      await expect(service.searchForPosts(text)).resolves.toEqual(expected);
      expect(spySearch).toHaveBeenCalled();
      expect(spyFind).toHaveBeenCalled();
    });
  });

  describe('when search for post by paragraph', () => {
    const paragraph = 'paragraph1';

    it('expect to return a null if not found any post', async () => {
      const spyQuery = jest
        .spyOn(mockedPostRepository, 'query')
        .mockResolvedValue([]);

      await expect(service.getPostsWithParagraph(paragraph)).resolves.toEqual(
        [],
      );
      expect(spyQuery).toHaveBeenCalled();
    });

    it('expect to return an array of posts', async () => {
      const posts = [mockedSearchPost1];
      const spyQuery = jest
        .spyOn(mockedPostRepository, 'query')
        .mockResolvedValue(posts);
      const expected = [mockedSearchPost1];

      await expect(service.getPostsWithParagraph(paragraph)).resolves.toEqual(
        expected,
      );
      expect(spyQuery).toHaveBeenCalled();
    });
  });
});
