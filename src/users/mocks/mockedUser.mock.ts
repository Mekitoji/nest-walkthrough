import { User } from '../user.entity';

export const mockedUserWithAvatar: User = {
  id: 1,
  email: 'user@email.com',
  name: 'Bob',
  password: 'password',
  address: {
    id: 1,
    street: 'streetName',
    city: 'cityName',
    country: 'countryName',
  },
  avatar: {
    id: 1,
    key: 'uuid',
    url: 'https://aws-url.com',
  },
  files: [],
};

export const mockedUserWithoutAvatar: User = {
  id: 1,
  email: 'user@email.com',
  name: 'Bob',
  password: 'password',
  address: {
    id: 1,
    street: 'streetName',
    city: 'cityName',
    country: 'countryName',
  },
  avatar: null,
  files: [],
};
