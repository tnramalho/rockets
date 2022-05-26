import { Module } from '@nestjs/common';
import { CrudModule } from '@concepta/nestjs-crud';
import { TypeOrmExtModule } from '@concepta/nestjs-typeorm-ext';
import { UserModule } from '@concepta/nestjs-user';
import { UserEntity } from './user/user.entity';
import { UserRepository } from './user/user.repository';

@Module({
  imports: [
    TypeOrmExtModule.registerAsync({
      useFactory: async () => {
        return {
          type: 'postgres',
          entities: [UserEntity],
        };
      },
      testMode: true,
    }),
    CrudModule.register(),
    UserModule.register({
      entities: {
        user: {
          entity: UserEntity,
          repository: UserRepository,
        },
      },
    }),
  ],
})
export class AppModule {}