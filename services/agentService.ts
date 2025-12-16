
import { supabase } from './supabaseClient';
import { Agent, Commission, CommissionRule, Member, Policy } from '../types';
import { accountingService } from './accountingService';

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
    commissionBalance: row.commission_balance || 0,
    bankDetails: row.bank_details || {},
    taxId: row.tax_id
});

export const agentService = {
    // --- Agents ---
    async getAll(): Promise<Agent[]> {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .order('name');
        
        if (error || !data) {
            console.error('Error fetching agents:', error);
            return [];
        }
        return data.map(mapAgent);
    },

    async save(agent: Agent): Promise<Agent | null> {
        const payload = {
            id: agent.id || undefined,
            name: agent.name,
            type: agent.type,
            nrc_id: agent.nrcId,
            email: agent.email,
            phone: agent.phone,
            address: agent.address,
            status: agent.status,
            date_onboarded: agent.dateOnboarded,
            bank_details: agent.bankDetails,
            tax_id: agent.taxId
        };

        const { data, error } = await supabase.from('agents').upsert(payload).select().single();
        if (error) {
            console.error('Agent save failed:', error);
            return null;
        }
        return mapAgent(data);
    },

    // --- Commissions ---
    async getCommissions(): Promise<Commission[]> {
        const { data, error } = await supabase
            .from('commissions')
            .select('*')
            .order('calculation_date', { ascending: false });

        if (error || !data) return [];
        
        return data.map((row: any) => ({
            id: row.id,
            agentId: row.agent_id,
            agentName: row.agent_name,
            referenceId: row.reference_id,
            sourceEntity: row.source_entity,
            amount: row.amount,
            calculationDate: row.calculation_date,
            status: row.status,
            ruleApplied: row.rule_applied,
            paymentReference: row.payment_reference,
            paymentDate: row.payment_date
        }));
    },

    async updateCommissionStatus(ids: string[], status: 'Approved' | 'Payable' | 'Paid', paymentRef?: string): Promise<void> {
        const updates: any = { status };
        if (status === 'Paid') {
            updates.payment_date = new Date().toISOString().split('T')[0];
            updates.payment_reference = paymentRef || `BATCH-${Date.now()}`;
        }

        await supabase
            .from('commissions')
            .update(updates)
            .in('id', ids);
    },

    // --- Rules ---
    async getRules(): Promise<CommissionRule[]> {
        const { data, error } = await supabase.from('commission_rules').select('*').order('name');
        if (error || !data) return [];
        return data.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            type: r.type,
            value: r.value,
            agentType: r.agent_type,
            productType: r.product_type,
            isActive: r.is_active
        }));
    },

    async seedDefaultRules(): Promise<void> {
        // Overwrite rules to match the new logic for display purposes
        const rules = [
            {
                id: 'RULE-TIER-BROKER-1',
                name: 'Broker Tier 1 (0-12m)',
                description: '10% of premium for first year',
                type: 'Percentage',
                value: 10,
                agent_type: 'Broker',
                product_type: 'All',
                is_active: true
            },
            {
                id: 'RULE-TIER-BROKER-2',
                name: 'Broker Tier 2 (13-24m)',
                description: '7.5% of premium for second year',
                type: 'Percentage',
                value: 7.5,
                agent_type: 'Broker',
                product_type: 'All',
                is_active: true
            },
            {
                id: 'RULE-TIER-BROKER-3',
                name: 'Broker Tier 3 (24m+)',
                description: '2.5% retention commission',
                type: 'Percentage',
                value: 2.5,
                agent_type: 'Broker',
                product_type: 'All',
                is_active: true
            },
            {
                id: 'RULE-TIER-INT-1',
                name: 'Internal Tier 1 (0-12m)',
                description: '10% of premium for first year',
                type: 'Percentage',
                value: 10,
                agent_type: 'Internal',
                product_type: 'All',
                is_active: true
            },
            {
                id: 'RULE-TIER-INT-2',
                name: 'Internal Tier 2 (13-24m)',
                description: '7.5% of premium for second year',
                type: 'Percentage',
                value: 7.5,
                agent_type: 'Internal',
                product_type: 'All',
                is_active: true
            }
        ];

        await supabase.from('commission_rules').upsert(rules);
    },

    // --- Calculation Engine ---
    async calculatePendingCommissions(): Promise<Commission[]> {
        const newCommissions: Commission[] = [];
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`; // e.g. "2024-6"

        // 1. Fetch Active Agents
        const { data: agents } = await supabase.from('agents').select('*').eq('status', 'Active');
        if (!agents || agents.length === 0) return [];

        // 2. Fetch Policies (to calculate premium)
        const { data: policies } = await supabase.from('policies').select('*');
        if (!policies) return [];

        // 3. Fetch Active Members who have agents
        // Note: In a real large DB, we would paginate or use a stored procedure.
        const { data: members } = await supabase
            .from('members')
            .select('*')
            .neq('agent_ids', '{}') // Only members with agents
            .eq('status', 'Active'); // Only active members generate commission

        if (!members) return [];

        // 4. Processing Loop
        for (const member of members) {
            // Find Policy
            const policy = policies.find(p => p.id === member.policy_id);
            if (!policy) continue;

            // Calculate Total Monthly Premium for this member
            let premium = 0;
            // Principal
            const age = new Date().getFullYear() - new Date(member.dob).getFullYear();
            if (age >= 65) premium += (policy.premium?.senior || 0);
            else premium += (policy.premium?.adult || 0);

            // Dependants
            const dependants = member.dependants || [];
            dependants.forEach((d: any) => {
                const dAge = new Date().getFullYear() - new Date(d.dob).getFullYear();
                if (dAge < 18) premium += (policy.premium?.child || 0);
                else if (dAge >= 65) premium += (policy.premium?.senior || 0);
                else premium += (policy.premium?.adult || 0);
            });

            // Calculate Tenure (Months since join)
            const joinDate = new Date(member.join_date);
            const tenureMonths = (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth());

            // Check number of agents to split commission
            const agentIds = member.agent_ids || [];
            const numberOfAgents = agentIds.length;

            if (numberOfAgents === 0) continue;

            // Process for each linked agent (Primary/Secondary)
            for (const agentId of agentIds) {
                const agent = agents.find(a => a.id === agentId);
                if (!agent) continue;

                // --- APPLY COMMISSION RULES ---
                let rate = 0;
                let ruleName = 'Standard';

                // Map 'Individual' type to 'Broker' logic for now
                const type = (agent.type === 'Individual') ? 'Broker' : agent.type;

                if (type === 'Broker') {
                    if (tenureMonths <= 12) { rate = 0.10; ruleName = 'Broker Tier 1 (0-12m)'; }
                    else if (tenureMonths <= 24) { rate = 0.075; ruleName = 'Broker Tier 2 (13-24m)'; }
                    else { rate = 0.025; ruleName = 'Broker Tier 3 (24m+)'; }
                } 
                else if (type === 'Internal') {
                    if (tenureMonths <= 12) { rate = 0.10; ruleName = 'Internal Tier 1 (0-12m)'; }
                    else if (tenureMonths <= 24) { rate = 0.075; ruleName = 'Internal Tier 2 (13-24m)'; }
                    else { rate = 0; ruleName = 'Internal Tier 3 (No Comm)'; }
                }

                if (rate > 0) {
                    // Calculate base amount
                    let amount = premium * rate;
                    
                    // SPLIT LOGIC: Divide the commission by the number of agents sharing the member
                    if (numberOfAgents > 1) {
                        amount = amount / numberOfAgents;
                        ruleName += ` (Split / ${numberOfAgents})`;
                    }

                    const commissionId = `COM-${currentMonthKey}-${member.id}-${agent.id}`;

                    // Check if already exists for this month (Idempotency)
                    const { data: existing } = await supabase.from('commissions').select('id').eq('id', commissionId).single();
                    
                    if (!existing) {
                        const newComm = {
                            id: commissionId,
                            agent_id: agent.id,
                            agent_name: agent.name,
                            reference_id: member.id, // Linking to Member ID as reference for premium
                            source_entity: `Premium: ${member.first_name} ${member.last_name} (${policy.currency})`,
                            amount: amount,
                            calculation_date: new Date().toISOString().split('T')[0],
                            status: 'Pending',
                            rule_applied: ruleName
                        };

                        await supabase.from('commissions').insert(newComm);
                        
                        // ACCOUNTING HOOK: Commission Generated (Pending)
                        // Post journal for accrued expense
                        await accountingService.postCommissionEvent(newComm.id, newComm.amount, newComm.agent_name);

                        newCommissions.push({
                            ...newComm,
                            agentId: newComm.agent_id,
                            agentName: newComm.agent_name,
                            referenceId: newComm.reference_id,
                            sourceEntity: newComm.source_entity,
                            calculationDate: newComm.calculation_date,
                            ruleApplied: newComm.rule_applied,
                            status: 'Pending'
                        } as Commission);
                    }
                }
            }
        }

        return newCommissions;
    }
};
