
import { api } from './api';
import { PremiumPayer, Invoice, Payment, PayerDocument, Member } from '../types';
import { MOCK_PREMIUM_PAYERS, MOCK_INVOICES } from './mockData';

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
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    status: row.status
});

export const payerService = {
  async getAll(): Promise<PremiumPayer[]> {
    const data = await api.get('/payers');
    if (!data) return MOCK_PREMIUM_PAYERS;
    return data.map(mapPayer);
  },

  async save(payer: PremiumPayer): Promise<PremiumPayer | null> {
    const payload = {
      id: payer.id || `PAY-${Date.now()}`,
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
    const data = await api.post('/payers', payload);
    
    // Fallback if API offline
    if (!data) {
        return { ...payer, id: payload.id };
    }
    
    return mapPayer(data);
  },

  async delete(id: string): Promise<void> {
    // Stub
  },

  async getMembers(payerId: string): Promise<Member[]> {
    // Fallback to empty as backend implementation for filtering is basic
    return [];
  },

  async getInvoices(payerId: string): Promise<Invoice[]> {
      const data = await api.get(`/invoices?payer_id=${payerId}`);
      if (!data) return MOCK_INVOICES.filter(i => i.payerId === payerId);
      return data.map(mapInvoice);
  },

  async getAllInvoices(): Promise<Invoice[]> {
      const data = await api.get('/invoices');
      if (!data) return MOCK_INVOICES;
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
      const data = await api.post('/invoices', payload);
      
      // Fallback
      if(!data) return invoice;
      
      return mapInvoice(data);
  },

  async getPayments(payerId: string): Promise<Payment[]> {
      // Stub
      return [];
  },

  async recordPayment(payment: Payment): Promise<Payment | null> {
      // Stub
      return payment;
  },

  async autoAllocatePayment(payerId: string, paymentId: string, amount: number): Promise<void> {
      // Stub
  },

  async getDocuments(payerId: string): Promise<PayerDocument[]> {
      return [];
  }
};
