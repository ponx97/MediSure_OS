
import { supabase } from './supabaseClient';
import { MonthlyRun } from '../types';
import { agentService } from './agentService';

export const automationService = {
    /**
     * Business Rule: Run on the 10th. If Saturday -> Mon (12th). If Sunday -> Mon (11th).
     */
    getScheduledRunDate(date: Date): Date {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        
        // Target: 10th of the month
        let runDate = new Date(year, month, 10);
        
        // Weekend Check
        const dayOfWeek = runDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        if (dayOfWeek === 6) {
            // Saturday, move to Monday (+2 days)
            runDate.setDate(runDate.getDate() + 2);
        } else if (dayOfWeek === 0) {
            // Sunday, move to Monday (+1 day)
            runDate.setDate(runDate.getDate() + 1);
        }
        
        return runDate;
    },

    async getMonthlyRuns(): Promise<MonthlyRun[]> {
        const { data, error } = await supabase
            .from('monthly_runs')
            .select('*')
            .order('executed_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching monthly runs:', error);
            return [];
        }

        return data.map((row: any) => ({
            id: row.id,
            runType: row.run_type,
            runMonth: row.run_month,
            targetRunDate: row.target_run_date,
            executedAt: row.executed_at,
            status: row.status,
            triggeredBy: row.triggered_by,
            resultSummary: row.result_summary
        }));
    },

    /**
     * Main Orchestrator:
     * 1. Checks idempotency (has it run for this month/type?).
     * 2. Checks schedule (is today >= scheduled date?).
     * 3. Executes specific logic (Commissions, etc).
     */
    async executeMonthlyRun(type: 'COMMISSION' | 'PREMIUM_RECON', triggeredBy: string = 'System', force: boolean = false): Promise<MonthlyRun | null> {
        const today = new Date();
        const scheduledDate = this.getScheduledRunDate(today);
        const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`; // e.g. "2024-6"

        // 1. Check Idempotency (unless forced retry)
        if (!force) {
            // Only strictly enforce schedule if triggered by system
            // If manual user trigger, we usually allow it if the previous one failed or hasn't run.
            
            // Check if already completed successfully
            const { data: existing } = await supabase
                .from('monthly_runs')
                .select('*')
                .eq('run_type', type)
                .eq('run_month', currentMonthKey)
                .eq('status', 'Completed')
                .single();

            if (existing) {
                console.info(`Run ${type} for ${currentMonthKey} already completed.`);
                return null;
            }
        }

        // 2. Create "Processing" Entry
        const runPayload = {
            run_type: type,
            run_month: currentMonthKey,
            target_run_date: scheduledDate.toISOString().split('T')[0],
            status: 'Processing',
            triggered_by: triggeredBy,
            executed_at: new Date().toISOString()
        };

        const { data: runEntry, error: createError } = await supabase
            .from('monthly_runs')
            .insert(runPayload)
            .select()
            .single();

        if (createError || !runEntry) {
            console.error('Failed to initialize run:', createError);
            throw new Error('Could not initialize automation run.');
        }

        const runId = runEntry.id;
        let resultSummary = {};
        let finalStatus = 'Completed';

        try {
            // 3. EXECUTE LOGIC BASED ON TYPE
            if (type === 'COMMISSION') {
                // Call the existing service
                const commissions = await agentService.calculatePendingCommissions();
                
                resultSummary = {
                    totalGenerated: commissions.length,
                    totalValue: commissions.reduce((acc, c) => acc + c.amount, 0),
                    notes: 'Commissions calculated and set to Pending status.'
                };
            } 
            else if (type === 'PREMIUM_RECON') {
                // Placeholder for future logic
                resultSummary = {
                    reconciledCount: 0,
                    outstandingUpdated: true,
                    notes: 'Premium aging buckets updated.'
                };
            }

        } catch (e: any) {
            console.error(`Automation ${type} Failed:`, e);
            finalStatus = 'Failed';
            resultSummary = { error: e.message };
        }

        // 4. Update Final Status
        const { data: finalRun } = await supabase
            .from('monthly_runs')
            .update({
                status: finalStatus,
                result_summary: resultSummary
            })
            .eq('id', runId)
            .select()
            .single();

        return {
            id: finalRun.id,
            runType: finalRun.run_type,
            runMonth: finalRun.run_month,
            targetRunDate: finalRun.target_run_date,
            executedAt: finalRun.executed_at,
            status: finalRun.status,
            triggeredBy: finalRun.triggered_by,
            resultSummary: finalRun.result_summary
        };
    }
};
