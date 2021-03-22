import { User } from '../../users/user.entity';

export const mockedUser: User = {
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
  files: [],
};
