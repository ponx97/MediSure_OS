
import { api } from './api';
import { Account, JournalEntry } from '../types';

export const accountingService = {
    async getChartOfAccounts(): Promise<Account[]> {
        return [];
    },

    async createAccount(account: Partial<Account>): Promise<Account | null> {
        return null;
    },

    async getJournalEntries(limit = 100): Promise<JournalEntry[]> {
        return [];
    },

    async postJournal(entry: any, lines: any[]): Promise<boolean> {
        return true;
    },

    async postInvoiceEvent(invoiceId: string, amount: number, payerName: string) {},
    async postPaymentEvent(paymentId: string, amount: number, payerName: string) {},
    async postClaimApprovedEvent(claimId: string, amount: number, providerName: string) {},
    async postCommissionEvent(commId: string, amount: number, agentName: string) {},
    async seedDefaults() {}
};
