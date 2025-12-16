
import { supabase } from './supabaseClient';
import { Account, JournalEntry, JournalLine, AccountingPeriod } from '../types';

export const accountingService = {
    // --- Chart of Accounts ---
    async getChartOfAccounts(): Promise<Account[]> {
        const { data, error } = await supabase.from('accounts').select('*').order('code');
        if (error) return [];
        return data.map((a: any) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            type: a.type,
            category: a.category,
            isSystem: a.is_system
        }));
    },

    async createAccount(account: Partial<Account>): Promise<Account | null> {
        const { data, error } = await supabase.from('accounts').insert(account).select().single();
        if (error) {
            console.error('Account creation failed', error);
            return null;
        }
        return data;
    },

    // --- Journal Entries ---
    async getJournalEntries(limit = 100): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('journal_entries')
            .select(`
                *,
                lines: journal_lines (
                    *,
                    account: accounts (code, name)
                )
            `)
            .order('transaction_date', { ascending: false })
            .limit(limit);

        if (error) return [];

        return data.map((row: any) => ({
            id: row.id,
            transactionDate: row.transaction_date,
            description: row.description,
            referenceId: row.reference_id,
            sourceModule: row.source_module,
            status: row.status,
            totalAmount: row.total_amount,
            lines: row.lines.map((l: any) => ({
                id: l.id,
                accountId: l.account_id,
                accountCode: l.account.code,
                accountName: l.account.name,
                description: l.description,
                debit: l.debit,
                credit: l.credit
            }))
        }));
    },

    // --- Core Posting Logic ---
    async postJournal(entry: Partial<JournalEntry>, lines: Partial<JournalLine>[]): Promise<boolean> {
        // 1. Validation: Debits must equal Credits
        const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
        const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('Journal unbalanced', totalDebit, totalCredit);
            return false;
        }

        // 2. Check Period status (simplified: assume open if not checked)
        // In prod, check accounting_periods table here.

        // 3. Create Header
        const headerPayload = {
            transaction_date: entry.transactionDate,
            description: entry.description,
            reference_id: entry.referenceId,
            source_module: entry.sourceModule,
            status: 'Posted',
            total_amount: totalDebit
        };

        const { data: header, error: headerError } = await supabase
            .from('journal_entries')
            .insert(headerPayload)
            .select()
            .single();

        if (headerError) {
            console.error('Journal Header failed', headerError);
            return false;
        }

        // 4. Create Lines
        const linesPayload = lines.map(l => ({
            journal_id: header.id,
            account_id: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            description: l.description
        }));

        const { error: linesError } = await supabase.from('journal_lines').insert(linesPayload);
        
        if (linesError) {
            console.error('Journal Lines failed', linesError);
            // In a real DB transaction, we would rollback here.
            return false;
        }

        return true;
    },

    // --- Automated Event Hooks ---
    
    // Hook 1: When an Invoice is created (Debit AR, Credit Revenue)
    async postInvoiceEvent(invoiceId: string, amount: number, payerName: string) {
        const accounts = await this.getAccountMap();
        if (!accounts['1200'] || !accounts['4000']) return; // Ensure COA exists

        const lines = [
            { accountId: accounts['1200'], debit: amount, credit: 0, description: `Invoice for ${payerName}` }, // Accounts Receivable
            { accountId: accounts['4000'], debit: 0, credit: amount, description: `Premium Revenue` } // Revenue
        ];

        await this.postJournal({
            transactionDate: new Date().toISOString().split('T')[0],
            description: `Invoice Generated: ${payerName}`,
            referenceId: invoiceId,
            sourceModule: 'Billing'
        }, lines);
    },

    // Hook 2: When Payment Received (Debit Bank, Credit AR)
    async postPaymentEvent(paymentId: string, amount: number, payerName: string) {
        const accounts = await this.getAccountMap();
        if (!accounts['1000'] || !accounts['1200']) return;

        const lines = [
            { accountId: accounts['1000'], debit: amount, credit: 0, description: `Payment from ${payerName}` }, // Cash/Bank
            { accountId: accounts['1200'], debit: 0, credit: amount, description: `Allocation: ${payerName}` } // Accounts Receivable
        ];

        await this.postJournal({
            transactionDate: new Date().toISOString().split('T')[0],
            description: `Payment Received: ${payerName}`,
            referenceId: paymentId,
            sourceModule: 'Billing'
        }, lines);
    },

    // Hook 3: Claim Approved (Debit Claims Expense, Credit Claims Payable)
    async postClaimApprovedEvent(claimId: string, amount: number, providerName: string) {
        const accounts = await this.getAccountMap();
        if (!accounts['5000'] || !accounts['2100']) return;

        const lines = [
            { accountId: accounts['5000'], debit: amount, credit: 0, description: `Claim Expense: ${providerName}` }, // Claims Expense
            { accountId: accounts['2100'], debit: 0, credit: amount, description: `Liability: ${providerName}` } // Claims Payable
        ];

        await this.postJournal({
            transactionDate: new Date().toISOString().split('T')[0],
            description: `Claim Approved: ${claimId}`,
            referenceId: claimId,
            sourceModule: 'Claims'
        }, lines);
    },

    // Hook 4: Commission Generated (Debit Comm Expense, Credit Comm Payable)
    async postCommissionEvent(commId: string, amount: number, agentName: string) {
        const accounts = await this.getAccountMap();
        if (!accounts['5100'] || !accounts['2200']) return;

        const lines = [
            { accountId: accounts['5100'], debit: amount, credit: 0, description: `Commission Exp: ${agentName}` },
            { accountId: accounts['2200'], debit: 0, credit: amount, description: `Commission Liability` }
        ];

        await this.postJournal({
            transactionDate: new Date().toISOString().split('T')[0],
            description: `Commission Accrual: ${agentName}`,
            referenceId: commId,
            sourceModule: 'Commissions'
        }, lines);
    },

    // Helper to cache account IDs by code for automated posting
    async getAccountMap(): Promise<Record<string, string>> {
        const { data } = await supabase.from('accounts').select('id, code');
        const map: Record<string, string> = {};
        data?.forEach((a: any) => map[a.code] = a.id);
        return map;
    },

    // --- Seeding ---
    async seedDefaults() {
        const defaults = [
            // Assets
            { code: '1000', name: 'Cash & Bank', type: 'Asset', category: 'Current Asset', is_system: true },
            { code: '1200', name: 'Accounts Receivable', type: 'Asset', category: 'Current Asset', is_system: true },
            // Liabilities
            { code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Current Liability', is_system: true },
            { code: '2100', name: 'Claims Payable', type: 'Liability', category: 'Current Liability', is_system: true },
            { code: '2200', name: 'Commissions Payable', type: 'Liability', category: 'Current Liability', is_system: true },
            // Equity
            { code: '3000', name: 'Retained Earnings', type: 'Equity', category: 'Equity', is_system: true },
            // Revenue
            { code: '4000', name: 'Premium Revenue', type: 'Revenue', category: 'Operating Revenue', is_system: true },
            // Expenses
            { code: '5000', name: 'Claims Expense', type: 'Expense', category: 'Cost of Sales', is_system: true },
            { code: '5100', name: 'Commission Expense', type: 'Expense', category: 'Cost of Sales', is_system: true },
            { code: '6000', name: 'Operating Expenses', type: 'Expense', category: 'Opex', is_system: true },
        ];

        for (const acc of defaults) {
            await supabase.from('accounts').upsert(acc, { onConflict: 'code' });
        }
    }
};
