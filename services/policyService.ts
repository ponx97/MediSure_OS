
import { api } from './api';
import { Policy, Benefit } from '../types';
import { MOCK_POLICIES, MOCK_BENEFITS } from './mockData';

export const policyService = {
  async getPolicies(): Promise<Policy[]> {
    const data = await api.get('/policies');
    if (!data || data.length === 0) return MOCK_POLICIES;
    
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      currency: row.currency,
      coverageLimit: Number(row.coverage_limit),
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
    await api.post('/policies', payload);
  },

  async seedPolicies(): Promise<void> {
      // Logic would be to loop MOCK_POLICIES and call savePolicy
  },

  async getBenefits(): Promise<Benefit[]> {
    const data = await api.get('/benefits');
    if (!data || data.length === 0) return MOCK_BENEFITS;

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
      await api.post('/benefits', payload);
  },
  
  async deleteBenefit(id: string): Promise<void> {
      await api.delete(`/benefits/${id}`);
  },

  async seedBenefits(): Promise<void> {
      // Loop and save
  }
};
