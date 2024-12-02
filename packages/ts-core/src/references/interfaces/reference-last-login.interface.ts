import { ReferenceLastLogin } from '../reference.types';

/**
 * Identifiable by lastLogin.
 */
export interface ReferenceLastLoginInterface<T = ReferenceLastLogin> {
  lastLogin?: T | null;
}
