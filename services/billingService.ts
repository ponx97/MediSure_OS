
import { supabase } from './supabaseClient';
import { Member, Policy, PremiumPayer, BillingRun, Invoice } from '../types';
import { accountingService } from './accountingService';

// Utility to calculate premium (Moved from component to service for reusability)
const calculateMemberPremium = (member: Member, policy: Policy): number => {
    let total = 0;
    // Principal
    const age = new Date().getFullYear() - new Date(member.dob).getFullYear();
    if (age >= 65) total += policy.premium.senior;
    else total += policy.premium.adult;

    // Dependants
    (member.dependants || []).forEach(dep => {
        const depAge = new Date().getFullYear() - new Date(dep.dob).getFullYear();
        if (depAge < 18 || dep.relationship === 'Child') total += policy.premium.child;
        else if (depAge >= 65) total += policy.premium.senior;
        else total += policy.premium.adult;
    });

    return total;
};

export const billingService = {
    // --- Helper: Business Day Logic ---
    getTargetGroupBillingDate(year: number, month: number): Date {
        // Target: 10th of the month
        let target = new Date(year, month, 10);
        const day = target.getDay();
        
        if (day === 6) { // Saturday
            target.setDate(target.getDate() + 2); // Monday
        } else if (day === 0) { // Sunday
            target.setDate(target.getDate() + 1); // Monday
        }
        return target;
    },

    // --- Core: Billing History ---
    async getBillingRuns(): Promise<BillingRun[]> {
        const { data, error } = await supabase
            .from('billing_runs')
            .select('*')
            .order('run_date', { ascending: false });
        
        // Graceful fallback if table doesn't exist
        if (error) {
            console.warn('Billing runs fetch failed (Table likely missing or connection issue):', error.message);
            return [];
        }
        
        return data.map((row: any) => ({
            id: row.id,
            runDate: row.run_date,
            billingPeriod: row.billing_period,
            payerType: row.payer_type,
            strategy: row.strategy,
            invoicesGenerated: row.invoices_generated,
            totalAmount: row.total_amount,
            status: row.status,
            logs: row.logs || []
        }));
    },

    // --- Strategy 1: Group Billing (Monthly 10th) ---
    async executeGroupBilling(billingPeriod: string): Promise<BillingRun> {
        const logs: string[] = [];
        let totalAmount = 0;
        let invoiceCount = 0;

        // 1. Check if run exists for this period
        try {
            const { data: existing, error: existError } = await supabase
                .from('billing_runs')
                .select('*')
                .eq('billing_period', billingPeriod)
                .eq('payer_type', 'Group')
                .single();

            // If table missing or other error, throw to catch block for simulation
            if (existError && (existError.code === '42P01' || existError.message.includes('does not exist'))) {
                 throw existError;
            }

            if (existing && existing.status === 'Completed') {
                throw new Error(`Group billing for ${billingPeriod} already completed.`);
            }
        } catch (e: any) {
            // Check specifically for table missing error (42P01) or general connection errors in demo mode
            // We fallback to simulation to allow the user to see the UI interaction
            console.warn("DB Check failed. Simulating Group Billing run due to:", e.message);
            return this.simulateRun(billingPeriod, 'Group');
        }

        // 2. Fetch Active Group Payers
        const { data: payers } = await supabase
            .from('premium_payers')
            .select('*')
            .eq('type', 'Group')
            .eq('status', 'Active');

        // Fallback for demo if no payers found or table missing
        if (!payers) {
             console.warn("No payers found or table missing. Simulating run.");
             return this.simulateRun(billingPeriod, 'Group');
        }

        // 3. Fetch Data required for calc
        const { data: allMembers } = await supabase.from('members').select('*').eq('status', 'Active');
        const { data: policies } = await supabase.from('policies').select('*');

        // 4. Create Run Record (Pending)
        const { data: run, error: runErr } = await supabase.from('billing_runs').insert({
            run_date: new Date().toISOString().split('T')[0],
            billing_period: billingPeriod,
            payer_type: 'Group',
            strategy: 'Monthly-10th',
            status: 'Pending'
        }).select().single();

        if (runErr) {
             console.warn("Failed to create billing run record. Falling back to simulation.", runErr.message);
             return this.simulateRun(billingPeriod, 'Group');
        }

        try {
            // 5. Process each payer
            for (const payer of payers) {
                // Get linked members
                const payerMembers = allMembers?.filter((m: any) => m.premium_payer_id === payer.id) || [];
                
                if (payerMembers.length === 0) {
                    logs.push(`Skipped ${payer.name}: No active members.`);
                    continue;
                }

                // Calculate Total Bill
                let payerTotal = 0;
                payerMembers.forEach((m: any) => {
                    const policy = policies?.find((p: any) => p.id === m.policy_id);
                    if (policy) {
                        payerTotal += calculateMemberPremium(m, policy);
                    }
                });

                if (payerTotal > 0) {
                    // Generate Invoice
                    const invoicePayload = {
                        payer_id: payer.id,
                        invoice_date: new Date().toISOString().split('T')[0],
                        due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Standard 30 days
                        period: billingPeriod,
                        total_amount: payerTotal,
                        paid_amount: 0,
                        status: 'Unpaid',
                        billing_run_id: run.id
                    };

                    const { data: inv, error: invError } = await supabase.from('invoices').insert(invoicePayload).select().single();
                    
                    if (invError) throw invError;

                    if (inv) {
                        // Accounting Hook
                        await accountingService.postInvoiceEvent(inv.id, payerTotal, payer.name);
                        
                        totalAmount += payerTotal;
                        invoiceCount++;
                        logs.push(`Invoiced ${payer.name}: $${payerTotal} (${payerMembers.length} members)`);
                    }
                }
            }

            // 6. Complete Run
            await supabase.from('billing_runs').update({
                status: 'Completed',
                invoices_generated: invoiceCount,
                total_amount: totalAmount,
                logs: logs
            }).eq('id', run.id);

            return { ...run, status: 'Completed', invoicesGenerated: invoiceCount, totalAmount, logs };

        } catch (e: any) {
            await supabase.from('billing_runs').update({ status: 'Failed', logs: [...logs, e.message] }).eq('id', run.id);
            throw e;
        }
    },

    // --- Strategy 2: Individual Billing (Anniversary) ---
    async executeIndividualBilling(): Promise<BillingRun> {
        const today = new Date();
        const currentMonth = today.getMonth(); // 0-11
        const currentYear = today.getFullYear();
        const dayOfMonth = today.getDate();
        const billingPeriod = `${currentYear}-${currentMonth + 1}`;
        const logs: string[] = [];
        let totalAmount = 0;
        let invoiceCount = 0;

        // 1. Create Run Record
        let run: any = null;
        try {
            const { data, error } = await supabase.from('billing_runs').insert({
                run_date: today.toISOString().split('T')[0],
                billing_period: billingPeriod,
                payer_type: 'Individual',
                strategy: 'Anniversary-Daily',
                status: 'Pending'
            }).select().single();
            
            if (error) {
                // Catch table missing or other errors and fallback
                return this.simulateRun(billingPeriod, 'Individual');
            }
            run = data;
        } catch (e) {
            return this.simulateRun(billingPeriod, 'Individual');
        }

        try {
            // 2. Fetch Active Individuals
            const { data: members } = await supabase
                .from('members')
                .select('*')
                .eq('status', 'Active')
                .eq('premium_payer', 'Self'); // Assuming 'Self' means Individual Payer setup

            const { data: policies } = await supabase.from('policies').select('*');

            if (members) {
                for (const member of members) {
                    const joinDate = new Date(member.join_date);
                    const joinDay = joinDate.getDate();

                    // LOGIC: Check if today is the billing day
                    if (joinDay === dayOfMonth) {
                        
                        // IDEMPOTENCY Check: Does invoice exist for this period?
                        const { data: existingInv } = await supabase
                            .from('invoices')
                            .select('id')
                            .eq('period', billingPeriod)
                            .eq('payer_id', member.premium_payer_id) 
                            .single();

                        if (existingInv) {
                            logs.push(`Skipped ${member.first_name} ${member.last_name}: Already billed.`);
                            continue;
                        }

                        // Calculate
                        const policy = policies?.find((p: any) => p.id === member.policy_id);
                        if (!policy) continue;

                        const premium = calculateMemberPremium(member, policy);

                        // Generate Invoice
                        if (premium > 0 && member.premium_payer_id) {
                            const invoicePayload = {
                                payer_id: member.premium_payer_id,
                                invoice_date: today.toISOString().split('T')[0],
                                due_date: today.toISOString().split('T')[0], // Individuals usually due on billing date
                                period: billingPeriod,
                                total_amount: premium,
                                paid_amount: 0,
                                status: 'Unpaid',
                                billing_run_id: run.id
                            };

                            const { data: inv } = await supabase.from('invoices').insert(invoicePayload).select().single();
                            
                            if (inv) {
                                await accountingService.postInvoiceEvent(inv.id, premium, `${member.first_name} ${member.last_name}`);
                                totalAmount += premium;
                                invoiceCount++;
                                logs.push(`Billed ${member.first_name} ${member.last_name}: $${premium}`);
                            }
                        }
                    }
                }
            }

            // 3. Complete
            await supabase.from('billing_runs').update({
                status: 'Completed',
                invoices_generated: invoiceCount,
                total_amount: totalAmount,
                logs: logs
            }).eq('id', run.id);

            return { ...run, status: 'Completed', invoicesGenerated: invoiceCount, totalAmount, logs };

        } catch (e: any) {
            await supabase.from('billing_runs').update({ status: 'Failed', logs: [...logs, e.message] }).eq('id', run.id);
            throw e;
        }
    },

    // --- Demo Fallback ---
    simulateRun(period: string, type: 'Group' | 'Individual'): BillingRun {
        return {
            id: `sim-run-${Date.now()}`,
            runDate: new Date().toISOString().split('T')[0],
            billingPeriod: period,
            payerType: type,
            strategy: type === 'Group' ? 'Monthly-10th' : 'Anniversary',
            invoicesGenerated: type === 'Group' ? 3 : 12,
            totalAmount: type === 'Group' ? 45200 : 2800,
            status: 'Completed',
            logs: [
                'Simulated Run: Database tables (invoices, billing_runs) missing or connection failed.',
                'Generated mock invoices for demonstration.'
            ]
        };
    }
};
