// src/clients/entities/client.entity.ts
export class Client {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  cpf: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Client>) {
    Object.assign(this, partial);
  }
}
