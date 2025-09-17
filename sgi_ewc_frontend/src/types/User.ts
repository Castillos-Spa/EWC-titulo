export interface User {
  id: number;
  username: string;
  email: string;
  area: string;
  roles: string[];
  permissions?: string[];
  active: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  mustChangePassword?: boolean; // <-- agrega esta línea
}
