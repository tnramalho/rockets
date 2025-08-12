import { PlainLiteralObject } from '@nestjs/common';

import {
  DeepPartial,
  UserProfileCreatableInterface,
  UserProfileEntityInterface,
} from '@concepta/nestjs-common';
import {
  ConfigurableCrudBuilder,
  ConfigurableCrudOptions,
} from '@concepta/nestjs-crud';

export class UserProfileCrudBuilder<
  Entity extends UserProfileEntityInterface = UserProfileEntityInterface,
  Creatable extends DeepPartial<Entity> &
    UserProfileCreatableInterface = DeepPartial<Entity> &
    UserProfileCreatableInterface,
  Updatable extends DeepPartial<Entity> = DeepPartial<Entity>,
  Replaceable extends Creatable = Creatable,
  ExtraOptions extends PlainLiteralObject = PlainLiteralObject,
> extends ConfigurableCrudBuilder<
  Entity,
  Creatable,
  Updatable,
  Replaceable,
  ExtraOptions
> {
  constructor(options: ConfigurableCrudOptions<Entity>) {
    super(options);
  }
}
