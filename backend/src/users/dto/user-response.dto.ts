export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
