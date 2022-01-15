import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'aws-sdk';

import { mockedConfigService } from '../utils/mocks/config.service';
import { FilesService } from './files.service';
import { PublicFile } from './publicFile.entity';
import { MockType } from '../utils/mocks/mockType';

const mockedS3Instance = {
  upload: jest.fn().mockReturnThis(),
  deleteObject: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => mockedS3Instance),
}));

describe('FilesService', () => {
  let service: FilesService;
  let mockedPublicFileRepository: MockType<Repository<PublicFile>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: getRepositoryToken(PublicFile),
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

    service = module.get<FilesService>(FilesService);
    mockedPublicFileRepository = module.get(getRepositoryToken(PublicFile));
  });

  describe('when trying upload public file', () => {
    describe('and get successful response from remote server', () => {
      let dataBuffer: Buffer;
      let filename: string;
      let file: PublicFile;

      beforeEach(() => {
        dataBuffer = Buffer.from('Hello test');
        filename = 'filename';
        file = new PublicFile();
        mockedS3Instance.promise.mockResolvedValue({ key: 'key', url: 'url' });
        mockedPublicFileRepository.save.mockResolvedValue({});
        mockedPublicFileRepository.create.mockResolvedValue(file);
      });

      it('expect to return a file', async () => {
        await expect(
          service.uploadPublicFile(dataBuffer, filename),
        ).resolves.toEqual(file);
      });
    });
  });
  describe('when deleting public file', () => {
    describe('and file is found', () => {
      let file: PublicFile;
      beforeEach(() => {
        file = new PublicFile();
        mockedPublicFileRepository.findOne.mockResolvedValue(file);
        mockedPublicFileRepository.delete.mockResolvedValue({});
        mockedS3Instance.promise.mockResolvedValue({});
      });
      it('expect to not throw error', async () => {
        const fileId = 1;
        await expect(service.deletePublicFile(fileId)).resolves.not.toThrow();
      });
    });
    describe('and file not found', () => {
      beforeEach(() => {
        mockedPublicFileRepository.findOne.mockResolvedValue(undefined);
        mockedS3Instance.promise.mockResolvedValue({});
      });
      it('expect to throw error', async () => {
        const fileId = 1;
        await expect(service.deletePublicFile(fileId)).rejects.toThrow();
      });
    });
  });
});
