import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '../crud.module';

import { default as ormConfig } from './ormconfig.fixture';
import { PhotoCcbSubModuleFixture } from './photo-ccb-sub/photo-ccb-sub.module.fixture';

@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    CrudModule.forRoot({}),
    PhotoCcbSubModuleFixture,
  ],
})
export class AppCcbSubModuleFixture {}
