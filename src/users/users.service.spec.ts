import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';

import { MockType } from '../utils/mocks/mockType';
import { FilesService } from '../files/files.service';
import { CreateUserDto } from './dto/createUser.dto';
import { User } from './user.entity';
import { PublicFile } from '../files/publicFile.entity';
import { UsersService } from './users.service';
import {
  mockedUserWithAvatar,
  mockedUserWithoutAvatar,
} from './mocks/mockedUser.mock';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockedUserRepository: MockType<Repository<User>>;
  let mockedFilesService: MockType<FilesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: {
            uploadPublicFile: jest.fn(),
            deletePublicFile: jest.fn(),
            deletePublicFileWithQueryRunner: jest.fn(),
          },
        },
        {
          provide: Connection,
          useValue: {
            createQueryRunner: jest.fn().mockReturnThis(),
            connect: jest.fn(),
            startTransaction: jest.fn(),
            manager: {
              update: jest.fn(),
            },
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockedUserRepository = module.get(getRepositoryToken(User));
    mockedFilesService = module.get(FilesService);
  });

  describe('when getting a user by email', () => {
    describe('and the user is found', () => {
      let user: User;

      beforeEach(() => {
        user = new User();
        mockedUserRepository.findOne.mockResolvedValue(user);
      });

      it('expect return the user', async () => {
        const fetchedUser = await service.getByEmail('test@test.com');
        expect(fetchedUser).toEqual(user);
      });
    });

    describe('and the user is not found', () => {
      beforeEach(() => {
        mockedUserRepository.findOne.mockResolvedValue(undefined);
      });

      it('expect throw an error', async () => {
        await expect(service.getByEmail('test@test.com')).rejects.toThrow();
      });
    });
  });

  describe('when getting a user by id', () => {
    describe('and the user is found', () => {
      let user: User;

      beforeEach(() => {
        user = new User();
        mockedUserRepository.findOne.mockResolvedValue(Promise.resolve(user));
      });

      it('expect return the user', async () => {
        const fetchedUser = await service.getById(1);
        expect(fetchedUser).toEqual(user);
      });
    });

    describe('and the user is not found', () => {
      beforeEach(() => {
        mockedUserRepository.findOne.mockResolvedValue(undefined);
      });

      it('expect throw an error', async () => {
        await expect(service.getById(1)).rejects.toThrow();
      });
    });
  });

  describe('when creating a user', () => {
    let user: User;
    let userData: CreateUserDto;
    beforeEach(() => {
      user = new User();
      mockedUserRepository.create.mockResolvedValue(user);
      mockedUserRepository.save.mockResolvedValue({});
    });
    it('expect to return a user', async () => {
      await expect(service.create(userData)).resolves.toEqual(user);
    });
  });

  describe('when trying to add user avatar ', () => {
    let user: User;
    let file: PublicFile;
    beforeEach(() => {
      user = new User();
      file = new PublicFile();
      mockedUserRepository.findOne.mockResolvedValue(user);
      mockedFilesService.uploadPublicFile.mockResolvedValue(file);
      mockedUserRepository.update.mockResolvedValue({});
    });
    it('expect to return a file', async () => {
      const userId = 1;
      const buffer = Buffer.from('Hello test');
      const filename = 'filename';
      await expect(
        service.addAvatar(userId, buffer, filename),
      ).resolves.toEqual(user);
    });
  });

  describe('when trying to delete user avatar ', () => {
    describe('and avatar exist', () => {
      beforeEach(() => {
        mockedUserRepository.findOne.mockResolvedValue(mockedUserWithAvatar);
        mockedUserRepository.update.mockResolvedValue({});
        mockedFilesService.deletePublicFileWithQueryRunner.mockResolvedValue(
          {},
        );
      });
      it('expect to not throw an error and return undefined', async () => {
        const userId = 1;
        await expect(service.deleteAvatar(userId)).resolves.toBeUndefined();
      });
    });
    describe('and avatar not exist', () => {
      beforeEach(() => {
        mockedUserRepository.findOne.mockResolvedValue(mockedUserWithoutAvatar);
      });
      it('expect to not throw an error', async () => {
        const userId = 1;
        await expect(service.deleteAvatar(userId)).rejects.toThrow();
      });
    });
  });

  describe('when setting current refresh token', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('string');
      mockedUserRepository.update.mockResolvedValue({});
    });
    it('expect to ', async () => {
      await expect(service.setCurrentRefreshToken('token', 1)).resolves.toEqual(
        undefined,
      );
    });
  });

  describe('when check if refresh token matches', () => {
    let user: User;
    beforeEach(() => {
      user = new User();
    });
    it('expect to update token', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      await expect(service.setCurrentRefreshToken('token', 1)).resolves.toEqual(
        undefined,
      );
    });
  });

  describe('when check if refresh token matches', () => {
    describe('and all matches', () => {
      let user: User;
      const compareSpy = jest.spyOn(bcrypt, 'compare');
      beforeEach(() => {
        user = new User();
        compareSpy.mockReset();
      });
      it('expect to return user', async () => {
        compareSpy.mockResolvedValue(true);

        const getByIdSpy = jest
          .spyOn(service, 'getById')
          .mockResolvedValue(user);
        await expect(
          service.getUserIfRefreshTokenMatches('token', 1),
        ).resolves.toEqual(user);
        expect(getByIdSpy).toHaveBeenCalled();
        expect(compareSpy).toHaveBeenCalled();
      });
    });

    describe('and something go wrong', () => {
      let user: User;
      const compareSpy = jest.spyOn(bcrypt, 'compare');
      beforeEach(() => {
        user = new User();
        compareSpy.mockReset();
      });
      it('expect throw error if user not found', async () => {
        const getByIdSpy = jest
          .spyOn(service, 'getById')
          .mockResolvedValue(null);
        await expect(
          service.getUserIfRefreshTokenMatches('token', 1),
        ).rejects.toThrow();
        expect(getByIdSpy).toHaveBeenCalled();
        expect(compareSpy).not.toHaveBeenCalled();
      });

      it('expect throw error if refresh token do not match', async () => {
        compareSpy.mockResolvedValue(false);
        const getByIdSpy = jest
          .spyOn(service, 'getById')
          .mockResolvedValue(user);
        await expect(
          service.getUserIfRefreshTokenMatches('token', 1),
        ).rejects.toThrow();

        expect(compareSpy).toHaveBeenCalled();
        expect(getByIdSpy).toHaveBeenCalled();
      });
    });
  });

  describe('when removing refresh token', () => {
    beforeEach(() => {
      mockedUserRepository.update.mockResolvedValue(undefined);
    })
    it('expect to resolve', async () => {
       await expect(service.removeRefreshToken(1)).resolves.toEqual(undefined);
    });
  });
});
