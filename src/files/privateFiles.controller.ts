import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { RequestWithUser } from '../authentication/requestWithUser.interface';
import { FindOneParams } from '../utils/findOneParams';
import { PrivateFilesService } from './privateFiles.service';

@Controller('files')
export class PrivateFilesController {
  constructor(private readonly privateFileService: PrivateFilesService) {}

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'))
  public async addPrivateFile(
    @Req() request: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.privateFileService.uploadPrivateFile(
      file.buffer,
      request.user.id,
      file.originalname,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthenticationGuard)
  public async getPrivateFile(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) { id }: FindOneParams,
    @Res() res: Response,
  ) {
    const file = await this.privateFileService.getPrivateFile(
      request.user.id,
      id,
    );

    file.stream.pipe(res);
  }

  @Get()
  @UseGuards(JwtAuthenticationGuard)
  public async getAllPrivateFiles(@Req() request: RequestWithUser) {
    return this.privateFileService.getAllPrivateFiles(request.user.id);
  }
}
