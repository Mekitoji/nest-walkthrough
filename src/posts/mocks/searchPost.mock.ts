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
