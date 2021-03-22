import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { MockType } from '../utils/mocks/mockType';
import { CreateUserDto } from './dto/createUser.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { PublicFile } from '../files/publicFile.entity';
import {
  mockedUserWithAvatar,
  mockedUserWithoutAvatar,
} from './mocks/mockedUser.mock';

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
        mockedFilesService.deletePublicFile.mockResolvedValue({});
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
      it('expect to not throw an error and return undefined', async () => {
        const userId = 1;
        await expect(service.deleteAvatar(userId)).resolves.toBeUndefined();
      });
    });
  });
});
