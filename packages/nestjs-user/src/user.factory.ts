import Faker from '@faker-js/faker';
import { Type } from '@nestjs/common';
import { define } from 'typeorm-seeding';
import { UserInterface } from './interfaces/user.interface';

/**
 * User factory
 *
 * ```ts
 * // new factory instance
 * const userFactory = new UserFactory(User);
 *
 * // register it
 * userFactory.define();
 * ```
 */
export class UserFactory<T extends UserInterface = UserInterface> {
  /**
   * Constructor.
   *
   * @param entity The entity class.
   */
  constructor(private entity: Type<T>) {}

  /**
   * Define the user factory.
   */
  public define() {
    define(this.entity, this.factoryFn(this.entity));
  }

  /**
   * Factory callback function.
   *
   * @param entity The entity class.
   */
  protected factoryFn(entity: Type<T>) {
    // unique usernames that have already been used.
    const uniqueUsernames: Record<string, boolean> = {};

    return (faker: typeof Faker): T => {
      // the user we will return
      const user = new entity();

      // keep trying to get a unique username
      do {
        user.username = faker.internet.userName().toLowerCase();
      } while (uniqueUsernames[user.username]);

      // add to used usernames
      uniqueUsernames[user.username] = true;

      // return the new user
      return user;
    };
  }
}