
import { api } from './api';
import { Provider, Remittance, AuditLog } from '../types';
import { MOCK_PROVIDERS, MOCK_REMITTANCES } from './mockData';

const mapProviderFromDb = (row: any): Provider => ({
  id: row.id,
  name: row.name,
  discipline: row.discipline,
  type: row.type,
  status: row.status,
  afhozNumber: row.afhoz_number,
  licenseNumber: row.license_number,
  taxClearanceExpiry: row.tax_clearance_expiry,
  taxClearanceUrl: row.tax_clearance_url,
  address: row.address,
  primaryContactPerson: row.primary_contact_person,
  primaryContactPhone: row.primary_contact_phone,
  email: row.email,
  bankingDetails: row.banking_details || {},
  location: row.location,
  accreditationLevel: row.accreditation_level,
  joinedDate: row.joined_date,
});

export const providerService = {
  async getAll(): Promise<Provider[]> {
    const data = await api.get('/providers');
    if (!data) return MOCK_PROVIDERS;
    return data.map(mapProviderFromDb);
  },

  async save(provider: Provider, performedBy: string = 'System'): Promise<Provider | null> {
    const payload = {
      id: (provider.id && provider.id !== '') ? provider.id : `PRV-${Date.now()}`,
      name: provider.name,
      discipline: provider.discipline,
      type: provider.type,
      status: provider.status,
      afhoz_number: provider.afhozNumber,
      license_number: provider.licenseNumber,
      tax_clearance_expiry: provider.taxClearanceExpiry,
      tax_clearance_url: provider.taxClearanceUrl,
      address: provider.address,
      primary_contact_person: provider.primaryContactPerson,
      primary_contact_phone: provider.primaryContactPhone,
      email: provider.email,
      banking_details: provider.bankingDetails,
      location: provider.location,
      accreditation_level: provider.accreditationLevel,
      joined_date: provider.joinedDate || new Date().toISOString().split('T')[0],
    };

    const data = await api.post('/providers', payload);
    
    // Fallback if API offline
    if (!data) {
        return {
            ...provider,
            id: payload.id
        };
    }
    
    return mapProviderFromDb(data);
  },

  async getRemittances(providerId?: string): Promise<Remittance[]> {
    const data = await api.get('/remittances'); // Hypothetical endpoint
    if (!data) {
        return MOCK_REMITTANCES.filter(r => !providerId || r.providerId === providerId);
    }
    return data; 
  },

  async createRemittance(remittance: Remittance): Promise<void> {
    await api.post('/remittances', remittance);
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    // Stub
  },

  async getAuditLogs(providerId: string): Promise<AuditLog[]> {
    return [];
  }
};
