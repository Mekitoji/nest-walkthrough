import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrivateFilesController } from './privateFiles.controller';
import { PrivateFile } from './privateFile.entity';
import { PrivateFilesService } from './privateFiles.service';
import { User } from '../users/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PrivateFile, User])],
  providers: [PrivateFilesService],
  controllers: [PrivateFilesController],
})
export class PrivateFilesModule {}
