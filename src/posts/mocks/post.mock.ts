import { Post } from '../post.entity';

export const mockedPost: Post = {
  id: 1,
  title: 'title',
  paragraphs: ['paragraph1', 'paragraph2'],
  categories: [],
  author: {
    id: 1,
    email: 'test@test.com',
    name: 'John',
    password: 'password',
  },
  comments: [],
};
