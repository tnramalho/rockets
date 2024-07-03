import { applyDecorators } from '@nestjs/common';
import { ActionEnum } from '../enums/action.enum';
import { AccessControlGrant } from './access-control-grant.decorator';

/**
 * Read one resource grant shortcut
 *
 * @param string - resource The grant resource.
 * @returns Decorator function
 */
export const AccessControlReadOne = (
  resource: string,
): ReturnType<typeof applyDecorators> =>
  AccessControlGrant({
    resource: resource,
    action: ActionEnum.READ,
  });
