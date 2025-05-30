import { Module } from '@nestjs/common';

import { TypeOrmExtModule } from '../../typeorm-ext.module';

import { ormConfig } from './ormconfig.fixture';
import { TestModuleFixture } from './test.module.fixture';

@Module({
  imports: [TypeOrmExtModule.forRoot(ormConfig), TestModuleFixture],
})
export class AppModuleFixture {}
