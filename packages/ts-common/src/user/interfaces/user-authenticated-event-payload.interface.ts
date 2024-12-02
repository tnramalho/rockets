import {
  LiteralObject,
  ReferenceIdInterface,
  ReferenceQueryOptionsInterface,
} from '@concepta/ts-core';


export interface UserAuthenticatedEventPayloadInterface {
  user: ReferenceIdInterface;
  // TODO: review if need this
  data?: LiteralObject;
  queryOptions?: ReferenceQueryOptionsInterface;
}
