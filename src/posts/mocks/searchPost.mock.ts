import { Post } from '../post.entity';
import { PostSearchBody } from '../types/postSearchBody.interface';

export const mockedSearchPost1: PostSearchBody = {
  id: 1,
  title: 'title',
  paragraphs: ['paragraph1', 'paragraph2'],
  authorId: 1,
};

export const mockedSearchPost2: PostSearchBody = {
  id: 2,
  title: 'some title',
  paragraphs: ['some new content'],
  authorId: 2,
};

export const mockedPosts: Post[] = [
  {
    id: 1,
    title: 'title',
    paragraphs: ['paragraph1', 'paragraph2'],
    categories: [],
    comments: [],
  },
  {
    id: 2,
    title: 'title2',
    paragraphs: ['paragraph1', 'paragraph2'],
    categories: [],
    comments: [],
  },
  {
    id: 3,
    title: 'title2',
    paragraphs: ['paragraph1', 'paragraph2'],
    categories: [],
    comments: [],
  },
  {
    id: 4,
    title: 'title2',
    paragraphs: ['paragraph1', 'paragraph2'],
    categories: [],
    comments: [],
  },
];
