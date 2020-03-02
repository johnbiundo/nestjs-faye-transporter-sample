import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WorkService } from './work/work.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [WorkService],
})
export class AppModule {}
