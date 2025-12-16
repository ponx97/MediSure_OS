
import { api } from './api';
import { Agent, Commission, CommissionRule } from '../types';

const mapAgent = (row: any): Agent => ({
    id: row.id,
    name: row.name,
    type: row.type,
    nrcId: row.nrc_id,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status,
    dateOnboarded: row.date_onboarded,
    commissionBalance: Number(row.commission_balance || 0),
    bankDetails: row.bank_details || {},
    taxId: row.tax_id
});

export const agentService = {
    async getAll(): Promise<Agent[]> {
        const data = await api.get('/agents');
        if (!data) return [];
        return data.map(mapAgent);
    },

    async save(agent: Agent): Promise<Agent | null> {
        const data = await api.post('/agents', agent);
        if (!data) return agent; // Fallback
        return data;
    },

    async getCommissions(): Promise<Commission[]> {
        const data = await api.get('/commissions');
        if (!data) return [];
        return data.map((row: any) => ({
            id: row.id,
            agentId: row.agent_id,
            agentName: row.agent_name,
            referenceId: row.reference_id,
            sourceEntity: row.source_entity,
            amount: Number(row.amount),
            calculationDate: row.calculation_date,
            status: row.status,
            ruleApplied: row.rule_applied
        }));
    },

    async updateCommissionStatus(ids: string[], status: string): Promise<void> {
        // Stub
    },

    async getRules(): Promise<CommissionRule[]> {
        return [];
    },

    async seedDefaultRules(): Promise<void> {
        // Stub
    },

    async calculatePendingCommissions(): Promise<Commission[]> {
        return [];
    }
};
