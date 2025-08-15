import { Module } from '@nestjs/common';
import { ReposService } from './repos.service';
import { ReposController } from './repos.controller';
import { UserModule} from '../user/user.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [UserModule, HttpModule],
  providers: [ReposService],
  controllers: [ReposController]
})
export class ReposModule {}
