import { CrudActions } from '@nestjsx/crud';

import { ApiResponseOptions } from '@nestjs/swagger';

export interface CrudApiResponseMetadataInterface {
  propertyKey: string | symbol;
  action: CrudActions;
  options: ApiResponseOptions | undefined;
}
