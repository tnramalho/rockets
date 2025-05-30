import { Module } from '@nestjs/common';

import { TypeOrmExtModule } from '../../typeorm-ext.module';
import { TestModelServiceFixture } from '../model/test-model.service.fixture';

import { TypeOrmRepositoryAdapterFixture } from './services/typeorm-repository.adapter.fixture';
import { TestEntityFixture } from './test.entity.fixture';

@Module({
  imports: [
    TypeOrmExtModule.forFeature({
      audit: {
        entity: TestEntityFixture,
      },
    }),
  ],
  providers: [TypeOrmRepositoryAdapterFixture, TestModelServiceFixture],
  exports: [TypeOrmRepositoryAdapterFixture, TestModelServiceFixture],
})
export class TestModuleFixture {}
