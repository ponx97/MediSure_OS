
import { supabase } from './supabaseClient';
import { PremiumPayer, Invoice, Payment, PayerDocument, Member } from '../types';
import { MOCK_PREMIUM_PAYERS, MOCK_INVOICES } from './mockData';
import { accountingService } from './accountingService';

// Helper to map DB columns to Types
const mapPayer = (row: any): PremiumPayer => ({
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    taxId: row.tax_id,
    paymentTerms: row.payment_terms,
    status: row.status
});

const mapInvoice = (row: any): Invoice => ({
    id: row.id,
    payerId: row.payer_id,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    period: row.period,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    status: row.status
});

const mapPayment = (row: any): Payment => ({
    id: row.id,
    payerId: row.payer_id,
    amount: row.amount,
    method: row.method,
    date: row.date,
    reference: row.reference,
    status: row.status,
    allocatedToInvoiceId: row.allocated_to_invoice_id
});

const mapDocument = (row: any): PayerDocument => ({
    id: row.id,
    payerId: row.payer_id,
    name: row.name,
    type: row.type,
    date: row.date,
    size: row.size,
    url: row.url
});

const mapMember = (row: any): Member => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    idNumber: row.id_number,
    dob: row.dob,
    status: row.status,
    policyId: row.policy_id,
    joinDate: row.join_date,
    premiumPayer: row.premium_payer,
    premiumPayerId: row.premium_payer_id,
    dependants: row.dependants || [],
    medicalHistory: row.medical_history || { conditions: [], allergies: [], medications: [] },
    bankingDetails: row.banking_details || {},
    agentIds: row.agent_ids || [],
    address: row.address,
    phoneNumber: row.phone_number,
    gender: row.gender,
    maritalStatus: row.marital_status,
    balance: row.balance || 0
});

export const payerService = {
  // --- Payers ---
  async getAll(): Promise<PremiumPayer[]> {
    const { data, error } = await supabase
      .from('premium_payers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('DB Fetch Error (Payers):', error.message);
      return MOCK_PREMIUM_PAYERS;
    }
    return data.map(mapPayer);
  },

  async save(payer: PremiumPayer): Promise<PremiumPayer | null> {
    const payload = {
      id: payer.id || undefined, // Allow Supabase to gen ID if new
      name: payer.name,
      type: payer.type,
      address: payer.address,
      contact_person: payer.contactPerson,
      phone: payer.phone,
      email: payer.email,
      tax_id: payer.taxId,
      payment_terms: payer.paymentTerms,
      status: payer.status
    };

    const { data, error } = await supabase.from('premium_payers').upsert(payload).select().single();
    if (error) {
        console.error(error);
        return null;
    }
    return mapPayer(data);
  },

  async delete(id: string): Promise<void> {
    await supabase.from('premium_payers').delete().eq('id', id);
  },

  // --- Linked Members ---
  async getMembers(payerId: string): Promise<Member[]> {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('premium_payer_id', payerId);
    
    if (error) {
        console.error("Error fetching payer members:", error.message);
        return [];
    }
    return data.map(mapMember);
  },

  // --- Invoices ---
  async getInvoices(payerId: string): Promise<Invoice[]> {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('payer_id', payerId)
        .order('invoice_date', { ascending: false });

      if (error) return MOCK_INVOICES.filter(i => i.payerId === payerId); // Fallback logic
      return data.map(mapInvoice);
  },

  async getAllInvoices(): Promise<Invoice[]> {
      const { data, error } = await supabase
        .from('invoices')
        .select('*');

      if (error || !data) return MOCK_INVOICES;
      return data.map(mapInvoice);
  },

  async createInvoice(invoice: Invoice): Promise<Invoice | null> {
      const payload = {
          id: invoice.id,
          payer_id: invoice.payerId,
          invoice_date: invoice.invoiceDate,
          due_date: invoice.dueDate,
          period: invoice.period,
          total_amount: invoice.totalAmount,
          paid_amount: invoice.paidAmount,
          status: invoice.status
      };

      const { data, error } = await supabase.from('invoices').insert(payload).select().single();
      if (error) {
          console.error("Error creating invoice", error);
          return invoice;
      }
      
      const newInvoice = mapInvoice(data);

      // ACCOUNTING HOOK: Invoice Created
      // We need the payer name for the description, fetch it lightly or pass it
      const { data: payer } = await supabase.from('premium_payers').select('name').eq('id', newInvoice.payerId).single();
      await accountingService.postInvoiceEvent(newInvoice.id, newInvoice.totalAmount, payer?.name || 'Unknown Payer');

      return newInvoice;
  },

  // --- Payments ---
  async getPayments(payerId: string): Promise<Payment[]> {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payer_id', payerId)
        .order('date', { ascending: false });

      if (error) return [];
      return data.map(mapPayment);
  },

  async recordPayment(payment: Payment): Promise<Payment | null> {
      const payload = {
          payer_id: payment.payerId,
          amount: payment.amount,
          method: payment.method,
          date: payment.date,
          reference: payment.reference,
          status: payment.status,
          allocated_to_invoice_id: payment.allocatedToInvoiceId
      };
      const { data, error } = await supabase.from('payments').insert(payload).select().single();
      if (error) return null;
      
      const newPayment = mapPayment(data);

      // ACCOUNTING HOOK: Payment Received
      const { data: payer } = await supabase.from('premium_payers').select('name').eq('id', newPayment.payerId).single();
      await accountingService.postPaymentEvent(newPayment.id, newPayment.amount, payer?.name || 'Unknown Payer');

      return newPayment;
  },

  // --- Allocation Logic ---
  async autoAllocatePayment(payerId: string, paymentId: string, amount: number): Promise<void> {
      // 1. Get unpaid invoices ordered by due date (oldest first)
      const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('payer_id', payerId)
          .neq('status', 'Paid')
          .order('due_date', { ascending: true });
      
      if (!invoices) return;

      let remaining = amount;
      
      for (const inv of invoices) {
          if (remaining <= 0) break;
          
          const outstanding = inv.total_amount - (inv.paid_amount || 0);
          const paymentForThis = Math.min(remaining, outstanding);
          
          const newPaidAmount = (inv.paid_amount || 0) + paymentForThis;
          const newStatus = newPaidAmount >= inv.total_amount ? 'Paid' : 'Partial';

          // Update invoice
          await supabase
            .from('invoices')
            .update({ paid_amount: newPaidAmount, status: newStatus })
            .eq('id', inv.id);
          
          remaining -= paymentForThis;
      }
      
      // Update payment status to allocated
      await supabase.from('payments').update({ status: 'Allocated' }).eq('id', paymentId);
  },

  // --- Documents ---
  async getDocuments(payerId: string): Promise<PayerDocument[]> {
      const { data, error } = await supabase
          .from('payer_documents')
          .select('*')
          .eq('payer_id', payerId)
          .order('date', { ascending: false });
      
      if (error) return [];
      return data.map(mapDocument);
  }
};
