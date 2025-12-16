
import { api } from './api';
import { User } from '../types';
import { MOCK_USERS } from './mockData';

export const userService = {
  async getAll(): Promise<User[]> {
    const data = await api.get('/users');
    if (!data || data.length === 0) return MOCK_USERS;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatarUrl: row.avatar_url
    }));
  },

  async save(user: User): Promise<User | null> {
    // Mock save for now as UI doesn't have a full User management backend endpoint yet
    return user;
  },

  async delete(id: string): Promise<void> {
    // Mock delete
  }
};
