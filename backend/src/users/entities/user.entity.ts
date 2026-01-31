import { Exclude } from 'class-transformer';

export class User {
  id: number;
  username: string;
  @Exclude()
  password: string;

  role: string;
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
