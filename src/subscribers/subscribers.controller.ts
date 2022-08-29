import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthenticationGuard } from '../authentication/guards/jwt-authentication.guard';
import { CreateSubscriberDTO } from './dto/create-subscriber.dto';
import { SUBSCRIBERS_SERVICE_TOKEN } from './subscribers.conts';

@Controller('subscribers')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthenticationGuard)
export class SubscribersController {
  constructor(
    @Inject(SUBSCRIBERS_SERVICE_TOKEN)
    private readonly subscribersService: ClientProxy,
  ) {}

  @Get()
  async getSubscribers() {
    return this.subscribersService.send({ cmd: 'get-all-subscribers' }, {});
  }

  @Post()
  async addSubscriber(@Body() subscriber: CreateSubscriberDTO) {
    return this.subscribersService.send({ cmd: 'add-subscriber' }, subscriber);
  }
}
