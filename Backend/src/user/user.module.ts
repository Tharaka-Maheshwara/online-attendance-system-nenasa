import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AzureUserSyncService } from './azure-user-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, AzureUserSyncService],
  exports: [UserService, AzureUserSyncService], // Export services for use in other modules
})
export class UserModule {}
