export default interface User {
  id?: number;
  username: string;
  password: string;
  role?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface Token {
  token: string;
}