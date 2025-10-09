import { ApiClient } from './ApiClient';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  roleAssignments?: { area: string; role: string; specialty?: string | null; permissions?: string[] }[];
}

class UserApiClass {
  async list(): Promise<AppUser[]> {
    return ApiClient.get<AppUser[]>(`/users`, true);
  }
}

export const UserApi = new UserApiClass();
