import { ModelOptions } from '@nestjsx/crud';

import { Type } from '@nestjs/common';

export interface CrudModelOptionsInterface extends ModelOptions {
  type: Type;
  paginatedType?: Type;
}
