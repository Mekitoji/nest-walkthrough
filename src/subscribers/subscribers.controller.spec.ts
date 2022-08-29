import { Test, TestingModule } from '@nestjs/testing';
import { SubscribersController } from './subscribers.controller';
import { SUBSCRIBERS_SERVICE_TOKEN } from './subscribers.conts';

describe('SubscribersController', () => {
  let controller: SubscribersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscribersController],
      providers: [
        {
          provide: SUBSCRIBERS_SERVICE_TOKEN,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<SubscribersController>(SubscribersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
