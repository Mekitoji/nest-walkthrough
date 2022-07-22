import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuid } from 'uuid';
import { S3 } from 'aws-sdk';
import { QueryRunner, Repository } from 'typeorm';

import { PublicFile } from './publicFile.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(PublicFile)
    private readonly publicFilesRepository: Repository<PublicFile>,
    private readonly configService: ConfigService,
  ) {}

  public async uploadPublicFile(
    dataBuffer: Buffer,
    filename: string,
  ): Promise<PublicFile> {
    const s3 = new S3();
    const uploadResult = await s3
      .upload({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Body: dataBuffer,
        Key: `${uuid()}-${filename}`,
      })
      .promise();
    const newFile = this.publicFilesRepository.create({
      key: uploadResult.Key,
      url: uploadResult.Location,
    });
    await this.publicFilesRepository.save(newFile);
    return newFile;
  }

  public async deletePublicFile(fileId: number): Promise<void> {
    const file = await this.publicFilesRepository.findOne({
      where: { id: fileId },
    });
    if (!file) {
      throw new HttpException(
        `File with id ${fileId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const s3 = new S3();
    await s3
      .deleteObject({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Key: file.key,
      })
      .promise();

    await this.publicFilesRepository.delete(fileId);
  }

  public async deletePublicFileWithQueryRunner(
    fileId: number,
    queryRunner: QueryRunner,
  ) {
    const file = await queryRunner.manager.findOne(PublicFile, {
      where: { id: fileId },
    });
    const s3 = new S3();
    await s3
      .deleteObject({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
        Key: file.key,
      })
      .promise();

    await queryRunner.manager.delete(PublicFile, fileId);
  }
}
