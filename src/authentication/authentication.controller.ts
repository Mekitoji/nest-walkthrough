import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthenticationService } from './authentication.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { LocalAuthenticationGuard } from './localAuthentication.guard';
import { RequestWithUser } from './requestWithUser.interface';

@Controller('authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  public async register(@Body() registrationData: RegisterDto) {
    return this.authenticationService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
  @Post('login')
  public async logIn(@Req() request: RequestWithUser) {
    const { user } = request;

    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(
      user.id,
    );
    const refreshTokenCookie = this.authenticationService.getCookieWithJwtRefreshToken(
      user.id,
    );

    this.usersService.setCurrentRefreshToken(refreshTokenCookie.token, user.id);

    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie.cookie,
    ]);
  }

  @UseGuards(JwtAuthenticationGuard)
  @HttpCode(200)
  @Post('logout')
  public async logout(@Req() request: RequestWithUser) {
    await this.usersService.removeRefreshToken(request.user.id);
    request.res.setHeader(
      'Set-Cookie',
      this.authenticationService.getCookieForLogout(),
    );
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  public authenticate(@Req() request: RequestWithUser) {
    const { user } = request;
    return user;
  }

  @UseGuards(JwtRefreshGuard)
  @Get('/refresh')
  public refresh(@Req() request: RequestWithUser) {
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(
      request.user.id,
    );
    request.res.setHeader('Set-Cookie', accessTokenCookie);

    return request.user;
  }
}
