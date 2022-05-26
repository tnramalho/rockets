import { FindConditions, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  ReferenceEmail,
  ReferenceId,
  ReferenceSubject,
  ReferenceUsername,
} from '@concepta/ts-core';
import { ReferenceLookupException } from '@concepta/typeorm-common';
import { InjectDynamicRepository } from '@concepta/nestjs-typeorm-ext';
import { USER_MODULE_USER_ENTITY_KEY } from '../user.constants';
import { UserEntityInterface } from '../interfaces/user-entity.interface';
import { UserLookupServiceInterface } from '../interfaces/user-lookup-service.interface';

/**
 * User lookup service
 */
@Injectable()
export class UserLookupService implements UserLookupServiceInterface {
  /**
   * Constructor
   *
   * @param userRepo instance of the user repo
   */
  constructor(
    @InjectDynamicRepository(USER_MODULE_USER_ENTITY_KEY)
    private userRepo: Repository<UserEntityInterface>,
  ) {}

  /**
   * Get user for the given id.
   *
   * @param id the id
   */
  async byId(id: ReferenceId): Promise<UserEntityInterface | undefined> {
    return this.findOne({ id });
  }

  /**
   * Get user for the given email.
   *
   * @param email the email
   */
  async byEmail(
    email: ReferenceEmail,
  ): Promise<UserEntityInterface | undefined> {
    return this.findOne({ email });
  }

  /**
   * Get user for the given subject.
   *
   * @param subject the subject
   */
  async bySubject(
    subject: ReferenceSubject,
  ): Promise<UserEntityInterface | undefined> {
    return this.findOne({ id: subject });
  }

  /**
   * Get user for the given username.
   *
   * @param username the username
   */
  async byUsername(
    username: ReferenceUsername,
  ): Promise<UserEntityInterface | undefined> {
    return this.findOne({ username });
  }

  /**
   * Find One wrapper.
   *
   * @private
   * @param conditions Find conditions
   */
  protected async findOne(
    conditions?: FindConditions<UserEntityInterface | undefined>,
  ): Promise<UserEntityInterface | undefined> {
    try {
      // try to find the user
      return this.userRepo.findOne(conditions);
    } catch (e) {
      // fatal orm error
      throw new ReferenceLookupException(this.userRepo.metadata.name, e);
    }
  }
}