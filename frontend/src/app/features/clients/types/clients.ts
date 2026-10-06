export default interface Client {
  id?: number;
  name: string;
  phone: string;
  address?: string;
  cpf?: string;
  cnpj?: string;
  stateRegistration?: string;
  ieIndicator?: '1' | '2' | '9';
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  cityCode?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}