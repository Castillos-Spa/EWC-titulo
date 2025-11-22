import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BukController } from './buk.controller';
import { BukService } from './buk.service';
import { UsersModule } from '@/features/users/users.module';

@Module({
  imports: [HttpModule, UsersModule],
  controllers: [BukController],
  providers: [BukService],
  exports: [BukService],
})
export class BukModule {}
