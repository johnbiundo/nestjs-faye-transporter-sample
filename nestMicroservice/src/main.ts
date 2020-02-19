import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

import {
  ServerFaye,
  OutboundResponseIdentitySerializer,
  InboundMessageIdentityDeserializer,
} from '@faye-tut/nestjs-faye-transporter';

async function bootstrap() {
  const logger = new Logger('Main:bootstrap');
  const app = await NestFactory.createMicroservice(AppModule, {
    strategy: new ServerFaye({
      url: 'http://localhost:8000/faye',
      serializer: new OutboundResponseIdentitySerializer(),
      deserializer: new InboundMessageIdentityDeserializer(),
    }),
  });
  app.listen(() => logger.verbose('Microservice is listening...'));
}

bootstrap();
