export class UserResponseDto {
  id: number;
  username: string;
  role: string;
  active: boolean;
  createdAt: Date;
  workplace: string;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
