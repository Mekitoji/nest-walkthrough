import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { mockedConfigService } from '../utils/mocks/config.service';
import { mockedJwtService } from '../utils/mocks/jwt.service';
import { AuthenticationService } from './authentication.service';
import { mockedUser } from './mocks/user.mock';
import { RegisterDto } from './dto/register.dto';
import { MockType } from '../utils/mocks/mockType';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';

class UniqueViolationException extends Error {
  public readonly code = PostgresErrorCode.UniqueViolation;
}

jest.mock('bcrypt');

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let mockedUserService: MockType<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            getByEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockedConfigService,
        },
        {
          provide: JwtService,
          useValue: mockedJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    mockedUserService = module.get(UsersService);
  });

  describe('when accessing the data of authenticating user', () => {
    describe('and password match', () => {
      beforeEach(() => {
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => true);
        mockedUserService.getByEmail.mockResolvedValue(mockedUser);
      });
      it('expect to get user', async () => {
        await expect(
          service.getAuthenticatedUser('user@email.com', 'password'),
        ).resolves.toEqual(mockedUser);
      });
    });

    describe('and password dont match', () => {
      beforeEach(() => {
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);
        mockedUserService.getByEmail.mockResolvedValue(mockedUser);
      });
      it('expect to throw error', async () => {
        await expect(
          service.getAuthenticatedUser('user@email.com', 'wrongPassword'),
        ).rejects.toThrow();
      });
    });

    describe('and user not found', () => {
      beforeEach(() => {
        mockedUserService.getByEmail.mockResolvedValue(undefined);
        jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);
      });
      it('expect to throw error', async () => {
        await expect(
          service.getAuthenticatedUser('some@email.com', 'coolPassword'),
        ).rejects.toThrow();
      });
    });
  });

  describe('when user logout', () => {
    it('expect return a logout cookie string', () => {
      const expected = [
        'Authentication=; HttpOnly; Path=/; Max-Age=0',
        'Refresh=; HttpOnly; Path=/; Max-Age=0',
      ];
      expect(service.getCookieForLogout()).toEqual(expected);
    });
  });

  describe('when creating a cookie with acccess token', () => {
    it('expect return a string', () => {
      const userId = 1;
      expect(typeof service.getCookieWithJwtAccessToken(userId)).toEqual(
        'string',
      );
    });
  });

  describe('when creating a cookie with refresh token', () => {
    it('expect return an object ', () => {
      const userId = 1;
      expect(typeof service.getCookieWithJwtRefreshToken(userId)).toEqual(
        'object',
      );
    });
  });

  describe('when registre a new user', () => {
    let user: User;
    let registrationData: RegisterDto;

    describe('and succesfully create it', () => {
      beforeEach(() => {
        user = new User();
        registrationData = {
          email: 'some@email.com',
          name: 'Joe',
          password: 'securePassword',
        };
        mockedUserService.create.mockResolvedValue(user);
      });
      it('expect to return user', async () => {
        await expect(service.register(registrationData)).resolves.toEqual(user);
      });
    });

    describe('throw an error', () => {
      beforeEach(() => {
        user = new User();
        registrationData = {
          email: 'alredy@exist.com',
          name: 'Joe',
          password: 'securePassword',
        };
      });
      it('when violation unique name', async () => {
        mockedUserService.create.mockRejectedValue(
          new UniqueViolationException(),
        );
        await expect(service.register(registrationData)).rejects.toThrow(
          'User with that email already exist',
        );
      });
      it('when something go wrong', async () => {
        mockedUserService.create.mockRejectedValue(new Error());
        await expect(service.register(registrationData)).rejects.toThrow(
          'Something went wrong',
        );
      });
    });
  });
});
