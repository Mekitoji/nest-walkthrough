import { Post } from '../post.entity';

export const mockedPost: Post = {
  id: 1,
  title: 'title',
  content: 'content',
  categories: [],
  author: {
    id: 1,
    email: 'test@test.com',
    name: 'John',
    password: 'password',
  },
};
