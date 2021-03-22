import { PrivateFile } from '../privateFile.entity';

export const mockedPrivateFile: PrivateFile = {
  id: 1,
  key: 'key-string',
  owner: {
    id: 1,
    name: 'John',
    email: 'test@test.com',
    password: 'strongPassword',
  },
};
