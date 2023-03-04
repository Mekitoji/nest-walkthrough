import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import 'aws-sdk';
import { Repository } from 'typeorm';
import { Readable } from 'stream';

import { MockType } from '../utils/mocks/mockType';
import { PrivateFile } from './privateFile.entity';
import { User } from '../users/user.entity';
import { mockedConfigService } from '../utils/mocks/config.service';
import { PrivateFilesService } from './privateFiles.service';

import { mockedPrivateFile } from './mocks/file.mock';
import { mockedUser } from './mocks/user.mock';

const mockedS3Instance = {
  upload: jest.fn().mockReturnThis(),
  deleteObject: jest.fn().mockReturnThis(),
  getObject: jest.fn().mockReturnThis(),
  createReadStream: jest.fn(),
  promise: jest.fn(),
  getSignedUrlPromise: jest.fn(),
};
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => mockedS3Instance),
}));

describe('PrivateFilesService', () => {
  let service: PrivateFilesService;
  let mockedPrivateFileRepository: MockType<Repository<PrivateFile>>;
  let mockedUserRepository: MockType<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivateFilesService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PrivateFile),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockedConfigService,
        },
      ],
    }).compile();

    service = module.get<PrivateFilesService>(PrivateFilesService);
    mockedPrivateFileRepository = module.get(getRepositoryToken(PrivateFile));
    mockedUserRepository = module.get(getRepositoryToken(User));
  });

  describe('when trying upload private file', () => {
    describe('and get successful response from remote server', () => {
      let dataBuffer: Buffer;
      let filename: string;
      let file: PrivateFile;

      beforeEach(() => {
        dataBuffer = Buffer.from('Hello test');
        filename = 'filename';
        file = new PrivateFile();
        mockedS3Instance.promise.mockResolvedValue({ key: 'key', url: 'url' });
        mockedPrivateFileRepository.save.mockResolvedValue({});
        mockedPrivateFileRepository.create.mockResolvedValue(file);
      });

      it('expect to return a file', async () => {
        const ownerId = 1;
        await expect(
          service.uploadPrivateFile(dataBuffer, ownerId, filename),
        ).resolves.toEqual(file);
      });
    });
  });

  describe('when getting private file', () => {
    describe('and file is found', () => {
      describe('and userId is match with ownerId', () => {
        const readableStream = new Readable();
        beforeEach(() => {
          mockedPrivateFileRepository.findOne.mockResolvedValue(
            mockedPrivateFile,
          );
          mockedS3Instance.createReadStream.mockReturnValue(readableStream);
        });
        it('expect to return stream and info about file', async () => {
          const fileId = 1;
          const userId = 1;
          const expected = {
            stream: readableStream,
            info: mockedPrivateFile,
          };
          await expect(service.getPrivateFile(userId, fileId)).resolves.toEqual(
            expected,
          );
        });
      });
      describe('and userId is not match with ownerId', () => {
        beforeEach(() => {
          mockedPrivateFileRepository.findOne.mockResolvedValue(
            mockedPrivateFile,
          );
        });
        it('expect to return throw an UnauthorizedException', async () => {
          const fileId = 1;
          const userId = 233;
          await expect(
            service.getPrivateFile(userId, fileId),
          ).rejects.toThrowError(UnauthorizedException);
        });
      });
    });

    describe('and file not found', () => {
      beforeEach(() => {
        mockedPrivateFileRepository.findOne.mockResolvedValue(undefined);
      });
      it('expect to throw NotFoundException', async () => {
        const fileId = 1;
        const userId = 1;
        await expect(
          service.getPrivateFile(userId, fileId),
        ).rejects.toThrowError(new NotFoundException());
      });
    });
  });

  describe('when trying to get all users files', () => {
    describe('and user not found', () => {
      beforeEach(() => {
        mockedUserRepository.findOne.mockResolvedValue(undefined);
      });
      it('expect to throw NotFoundException', async () => {
        const userId = 1;
        await expect(service.getAllPrivateFiles(userId)).rejects.toThrowError(
          new NotFoundException('User with this id not exist'),
        );
      });
    });

    describe('and found an user', () => {
      beforeEach(() => {
        mockedUserRepository.findOne.mockResolvedValue(mockedUser);
        mockedS3Instance.getSignedUrlPromise.mockResolvedValue('private url');
      });
      it('expect to return an array of user private files with temp link', async () => {
        const userId = 1;
        const expected = [
          {
            id: 1,
            key: 'key1',
            url: 'private url',
          },
          {
            id: 2,
            key: 'key2',
            url: 'private url',
          },
          {
            id: 3,
            key: 'key3',
            url: 'private url',
          },
        ];
        await expect(service.getAllPrivateFiles(userId)).resolves.toEqual(
          expected,
        );
      });
    });
  });
});
