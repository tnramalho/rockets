import { Expose, Type } from 'class-transformer';

import { CompanyDto } from '../../company/dto/company.dto';

export class NameDto {
  @Expose()
  first!: string | null;

  @Expose()
  last!: string | null;
}

export class UserDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  companyId?: number;

  @Expose()
  deletedAt?: Date;

  @Expose()
  @Type(() => NameDto)
  name!: NameDto;

  @Expose()
  @Type(() => CompanyDto)
  company?: CompanyDto;

  @Expose()
  @Type(() => CompanyDto)
  company2?: CompanyDto;
}
