import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { default as ormConfig } from './ormconfig.fixture';
import { PhotoModuleFixture } from './photo/photo.module.fixture';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), PhotoModuleFixture.register()],
})
export class AppModuleFixture {}
