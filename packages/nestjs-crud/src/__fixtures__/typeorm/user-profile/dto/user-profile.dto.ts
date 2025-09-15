import { Expose } from 'class-transformer';

export class UserProfileDto {
  @Expose()
  id!: string;

  @Expose()
  userId!: number;

  @Expose()
  nickName?: string;

  @Expose()
  favoriteColor?: string;
}
