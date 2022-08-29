import { Module } from '@nestjs/common';
import { SubscribersController } from './subscribers.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { SUBSCRIBERS_SERVICE_TOKEN } from './subscribers.conts';

@Module({
  imports: [ConfigModule],
  controllers: [SubscribersController],
  providers: [
    {
      provide: SUBSCRIBERS_SERVICE_TOKEN,
      useFactory: (configService: ConfigService) => {
        const user = configService.get<string>('RABBIT_USER');
        const password = configService.get<string>('RABBIT_PASSWORD');
        const host = configService.get<string>('RABBIT_HOST');
        const queue = configService.get<string>('RABBIT_QUEUE');

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${user}:${password}@${host}`],
            queue,
            queueOptions: {
              durable: true,
            },
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class SubscribersModule {}
