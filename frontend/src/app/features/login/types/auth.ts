export default interface User {
  id?: number;
  username: string;
  password: string;
  userType?: string;
}

export interface Token {
  token: string;
}