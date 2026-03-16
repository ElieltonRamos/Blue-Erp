// src/clients/dto/client-response.dto.ts
export class ClientResponseDto {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  cpf: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ClientResponseDto>) {
    Object.assign(this, partial);
  }
}
