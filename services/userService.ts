
import { supabase } from './supabaseClient';
import { User } from '../types';
import { MOCK_USERS } from './mockData';

export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_USERS;
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatarUrl: row.avatar_url
    }));
  },

  async save(user: User): Promise<User | null> {
    const payload = {
      id: user.id.startsWith('user-') ? `usr-${Date.now()}` : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl
    };

    const { data, error } = await supabase
      .from('app_users')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatar_url
    };
  },

  async delete(id: string): Promise<void> {
    await supabase.from('app_users').delete().eq('id', id);
  }
};
