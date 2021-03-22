import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { Repository } from 'typeorm';
import { PrivateFile } from './privateFile.entity';
import { v4 as uuid } from 'uuid';
import { Readable } from 'stream';
import { User } from '../users/user.entity';

@Injectable()
export class PrivateFilesService {
  constructor(
    @InjectRepository(PrivateFile)
    private privateFilesRepository: Repository<PrivateFile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  public async uploadPrivateFile(
    dataBuffer: Buffer,
    ownerId: number,
    filename: string,
  ): Promise<PrivateFile> {
    const s3 = new S3();
    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
        Body: dataBuffer,
        Key: `${uuid}-${filename}`,
      })
      .promise();

    const newFile = this.privateFilesRepository.create({
      key: uploadResult.Key,
      owner: { id: ownerId },
    });
    await this.privateFilesRepository.save(newFile);

    return newFile;
  }

  public async getPrivateFile(
    userId: number,
    fileId: number,
  ): Promise<{ stream: Readable; info: PrivateFile }> {
    const s3 = new S3();

    const fileInfo = await this.privateFilesRepository.findOne(
      { id: fileId },
      { relations: ['owner'] },
    );

    if (!fileInfo) {
      throw new NotFoundException();
    }

    if (fileInfo?.owner?.id !== userId) {
      throw new UnauthorizedException();
    }

    const stream = s3
      .getObject({
        Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
        Key: fileInfo.key,
      })
      .createReadStream();
    return {
      stream,
      info: fileInfo,
    };
  }

  private async generatePresignedUrl(key: string): Promise<string> {
    const s3 = new S3();

    return s3.getSignedUrlPromise('getObject', {
      Bucket: this.configService.get('AWS_PRIVATE_BUCKET_NAME'),
      Key: key,
    });
  }

  public async getAllPrivateFiles(
    userId: number,
  ): Promise<{ id: number; key: string; url: string }[]> {
    const userWithFiles = await this.usersRepository.findOne(userId, {
      relations: ['files'],
    });

    if (userWithFiles) {
      return Promise.all(
        userWithFiles.files.map(async (file) => {
          const url = await this.generatePresignedUrl(file.key);
          return {
            ...file,
            url,
          };
        }),
      );
    }

    throw new NotFoundException('User with this id not exist');
  }
}
