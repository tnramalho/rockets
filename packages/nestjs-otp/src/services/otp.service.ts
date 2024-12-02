import ms from 'ms';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DeepPartial, Repository } from 'typeorm';
import { Inject, Injectable, Type } from '@nestjs/common';
import {
  ReferenceAssigneeInterface,
  ReferenceAssignment,
  ReferenceId,
} from '@concepta/ts-core';
import { OtpCreatableInterface, OtpInterface } from '@concepta/ts-common';
import {
  QueryOptionsInterface,
  ReferenceLookupException,
  ReferenceMutateException,
  ReferenceValidationException,
  RepositoryProxy,
} from '@concepta/typeorm-common';
import {
  OTP_MODULE_REPOSITORIES_TOKEN,
  OTP_MODULE_SETTINGS_TOKEN,
} from '../otp.constants';
import { OtpSettingsInterface } from '../interfaces/otp-settings.interface';
import { OtpServiceInterface } from '../interfaces/otp-service.interface';
import { OtpCreateDto } from '../dto/otp-create.dto';
import { OtpTypeNotDefinedException } from '../exceptions/otp-type-not-defined.exception';
import { EntityNotFoundException } from '../exceptions/entity-not-found.exception';

@Injectable()
export class OtpService implements OtpServiceInterface {
  constructor(
    @Inject(OTP_MODULE_REPOSITORIES_TOKEN)
    private allOtpRepos: Record<string, Repository<OtpInterface>>,
    @Inject(OTP_MODULE_SETTINGS_TOKEN)
    protected readonly settings: OtpSettingsInterface,
  ) {}

  /**
   * Create a otp with a for the given assignee.
   *
   * @param assignment - The otp assignment
   * @param otp - The data to create
   */
  async create(
    assignment: ReferenceAssignment,
    otp: OtpCreatableInterface,
    queryOptions?: QueryOptionsInterface,
  ): Promise<OtpInterface> {
    if (!this.settings.types[otp.type])
      throw new OtpTypeNotDefinedException(otp.type);

    // get the assignment repo
    const assignmentRepo = this.getAssignmentRepo(assignment);

    // try to find the relationship
    try {
      // validate the data
      const dto = await this.validateDto<OtpCreateDto>(OtpCreateDto, otp);

      // generate a passcode
      const passcode = this.settings.types[otp.type].generator();

      // break out the vars
      const { category, type, assignee, expiresIn } = dto;

      // generate the expiration date
      const expirationDate = this.getExpirationDate(expiresIn);

      // new repo proxy
      const repoProxy = new RepositoryProxy<OtpInterface>(assignmentRepo);

      // try to save the item
      return repoProxy.repository(queryOptions).save({
        category,
        type,
        assignee,
        passcode,
        expirationDate,
      });
    } catch (e) {
      throw new ReferenceMutateException(assignmentRepo.metadata.targetName, {
        originalError: e,
      });
    }
  }

  /**
   * Check if otp is valid
   *
   * @param assignment - The otp assignment
   * @param otp - The otp to validate
   * @param deleteIfValid - If true, delete the otp if it is valid
   */
  async validate(
    assignment: ReferenceAssignment,
    otp: Pick<OtpInterface, 'category' | 'passcode'>,
    deleteIfValid = false,
    queryOptions?: QueryOptionsInterface,
  ): Promise<ReferenceAssigneeInterface | null> {
    // get otp from an assigned user for a category
    const assignedOtp = await this.getByPasscode(assignment, otp, queryOptions);

    // check if otp is expired
    const now = new Date();
    if (!assignedOtp || now > assignedOtp.expirationDate) return null;

    // determine if valid
    const isValid = !!assignedOtp;

    // if is valid and deleteIfValid is true, delete the otp
    if (isValid && deleteIfValid) {
      await this.deleteOtp(assignment, assignedOtp.id, queryOptions);
    }

    return assignedOtp;
  }

  /**
   * Delete a otp based on params
   *
   * @param assignment - The otp assignment
   * @param otp - The otp to delete
   */
  async delete(
    assignment: ReferenceAssignment,
    otp: Pick<OtpInterface, 'assignee' | 'category' | 'passcode'>,
    queryOptions?: QueryOptionsInterface,
  ): Promise<void> {
    // get otp from an assigned user for a category
    const assignedOtp = await this.getByPasscode(assignment, otp, queryOptions);

    if (assignedOtp) {
      this.deleteOtp(assignment, assignedOtp.id, queryOptions);
    }
  }

  /**
   * Clear all otps for assign in given category.
   *
   * @param assignment - The assignment of the repository
   * @param otp - The otp to clear
   */
  async clear(
    assignment: ReferenceAssignment,
    otp: Pick<OtpInterface, 'assignee' | 'category'>,
    queryOptions?: QueryOptionsInterface,
  ): Promise<void> {
    // get all otps from an assigned user for a category
    const assignedOtps = await this.getAssignedOtps(
      assignment,
      otp,
      queryOptions,
    );

    // Map to get ids
    const assignedOtpIds = assignedOtps.map((assignedOtp) => assignedOtp.id);

    if (assignedOtpIds.length > 0)
      await this.deleteOtp(assignment, assignedOtpIds, queryOptions);
  }

  /**
   * Delete OTP based on assignment
   *
   * @internal
   * @param assignment - The assignment to delete id from
   * @param id - The id or ids to delete
   */
  protected async deleteOtp(
    assignment: ReferenceAssignment,
    id: ReferenceId | ReferenceId[],
    queryOptions?: QueryOptionsInterface,
  ): Promise<void> {
    // get the assignment repo
    const assignmentRepo = this.getAssignmentRepo(assignment);

    // new repo proxy
    const repoProxy = new RepositoryProxy<OtpInterface>(assignmentRepo);

    try {
      // TODO: check 
      // seetings - garbage collection
      /**
       * 
      **/
      
      await repoProxy.repository(queryOptions).delete(id);
    } catch (e) {
      throw new ReferenceMutateException(assignmentRepo.metadata.targetName, {
        originalError: e,
      });
    }
  }

  /**
   * Get all OTPs for assignee.
   *
   * @param assignment - The assignment of the check
   * @param otp - The otp to get assignments
   */
  protected async getAssignedOtps(
    assignment: ReferenceAssignment,
    otp: Pick<OtpInterface, 'assignee' | 'category'>,
    queryOptions?: QueryOptionsInterface,
  ): Promise<OtpInterface[]> {
    // get the assignment repo
    const assignmentRepo = this.getAssignmentRepo(assignment);

    // break out the args
    const { assignee, category } = otp;

    // new repo proxy
    const repoProxy = new RepositoryProxy<OtpInterface>(assignmentRepo);

    // try to find the relationships
    try {
      // make the query
      const assignments = await repoProxy.repository(queryOptions).find({
        where: {
          assignee: { id: assignee.id },
          category,
        },
        relations: ['assignee'],
      });

      // return the otps from assignee
      return assignments;
    } catch (e) {
      throw new ReferenceLookupException(assignmentRepo.metadata.targetName, {
        originalError: e,
      });
    }
  }

  protected async getByPasscode(
    assignment: ReferenceAssignment,
    otp: Pick<OtpInterface, 'category' | 'passcode'>,
    queryOptions?: QueryOptionsInterface,
  ): Promise<OtpInterface | null> {
    // break out properties
    const { category, passcode } = otp;

    // get the assignment repo
    const assignmentRepo = this.getAssignmentRepo(assignment);

    // new repo proxy
    const repoProxy = new RepositoryProxy<OtpInterface>(assignmentRepo);

    // try to find the assignment
    try {
      // make the query
      const assignment = await repoProxy.repository(queryOptions).findOne({
        where: {
          category,
          passcode,
        },
        relations: ['assignee'],
      });

      // return the otps from assignee
      return assignment;
    } catch (e) {
      throw new ReferenceLookupException(assignmentRepo.metadata.targetName, {
        originalError: e,
      });
    }
  }

  /**
   * Get the assignment repo for the given assignment.
   *
   * @internal
   * @param assignment - The otp assignment
   */
  protected getAssignmentRepo(
    assignment: ReferenceAssignment,
  ): Repository<OtpInterface> {
    // repo matching assignment was injected?
    if (this.allOtpRepos[assignment]) {
      // yes, return it
      return this.allOtpRepos[assignment];
    } else {
      // bad assignment
      throw new EntityNotFoundException(assignment);
    }
  }

  // TODO: move to a separate service and reuse it on mutate service
  protected async validateDto<T extends DeepPartial<OtpInterface>>(
    type: Type<T>,
    data: T,
  ): Promise<T> {
    // convert to dto
    const dto = plainToInstance(type, data);

    // validate the data
    const validationErrors = await validate(dto);

    // any errors?
    if (validationErrors.length) {
      // yes, throw error
      throw new ReferenceValidationException(
        this.constructor.name,
        validationErrors,
      );
    }

    return dto;
  }

  // TODO: move this to a help function
  private getExpirationDate(expiresIn: string) {
    const now = new Date();

    // add time in seconds to now as string format
    return new Date(now.getTime() + ms(expiresIn));
  }
}
