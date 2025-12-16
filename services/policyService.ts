
import { supabase } from './supabaseClient';
import { Policy, Benefit } from '../types';
import { MOCK_POLICIES, MOCK_BENEFITS } from './mockData';

export const policyService = {
  async getPolicies(): Promise<Policy[]> {
    const { data, error } = await supabase.from('policies').select('*');
    // Keep fallback for initial load if DB empty, but prefer DB
    if (error || !data || data.length === 0) return MOCK_POLICIES;
    
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      currency: row.currency,
      coverageLimit: row.coverage_limit,
      copay: row.copay,
      premium: row.premium,
      features: row.features || [],
      benefits: row.benefits || []
    }));
  },

  async savePolicy(policy: Policy): Promise<void> {
    const payload = {
        id: policy.id,
        name: policy.name,
        type: policy.type,
        currency: policy.currency,
        coverage_limit: policy.coverageLimit,
        copay: policy.copay,
        premium: policy.premium,
        features: policy.features,
        benefits: policy.benefits
    };
    await supabase.from('policies').upsert(payload);
  },

  async seedPolicies(): Promise<void> {
      const payload = MOCK_POLICIES.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        currency: p.currency,
        coverage_limit: p.coverageLimit,
        copay: p.copay,
        premium: p.premium,
        features: p.features,
        benefits: p.benefits
      }));
      const { error } = await supabase.from('policies').upsert(payload);
      if (error) throw error;
  },

  async getBenefits(): Promise<Benefit[]> {
    const { data, error } = await supabase.from('benefits').select('*');
    if (error || !data || data.length === 0) return MOCK_BENEFITS;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      limitType: row.limit_type
    }));
  },

  async saveBenefit(benefit: Benefit): Promise<void> {
      const payload = {
          id: benefit.id,
          name: benefit.name,
          description: benefit.description,
          limit_type: benefit.limitType
      };
      await supabase.from('benefits').upsert(payload);
  },
  
  async deleteBenefit(id: string): Promise<void> {
      await supabase.from('benefits').delete().eq('id', id);
  },

  async seedBenefits(): Promise<void> {
      const payload = MOCK_BENEFITS.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description,
          limit_type: b.limitType
      }));
      const { error } = await supabase.from('benefits').upsert(payload);
      if (error) throw error;
  }
};
