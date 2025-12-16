
import { supabase } from './supabaseClient';
import { Provider, ProviderContract, Remittance, AuditLog } from '../types';
import { MOCK_PROVIDERS, MOCK_REMITTANCES } from './mockData';

// Mapping helper
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

const calculateChanges = (oldData: Provider, newData: Provider) => {
  const changes: Record<string, { old: any, new: any }> = {};
  const keysToCheck: (keyof Provider)[] = [
    'name', 'discipline', 'status', 'afhozNumber', 'licenseNumber', 
    'taxClearanceExpiry', 'address', 'primaryContactPerson', 'primaryContactPhone', 'email'
  ];

  keysToCheck.forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = { old: oldData[key], new: newData[key] };
    }
  });
  
  // Check banking details separately as it's an object
  if (JSON.stringify(oldData.bankingDetails) !== JSON.stringify(newData.bankingDetails)) {
      changes['bankingDetails'] = { old: oldData.bankingDetails, new: newData.bankingDetails };
  }

  return changes;
};

export const providerService = {
  async getAll(): Promise<Provider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching providers:', error);
      return MOCK_PROVIDERS; // Fallback for demo if DB empty
    }
    return data.map(mapProviderFromDb);
  },

  async save(provider: Provider, performedBy: string = 'System'): Promise<Provider | null> {
    // 1. Fetch existing for Audit
    let oldProvider: Provider | null = null;
    if (provider.id && !provider.id.startsWith('PRV-TEMP')) {
       const { data: existing } = await supabase.from('providers').select('*').eq('id', provider.id).single();
       if (existing) oldProvider = mapProviderFromDb(existing);
    }

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

    const { data, error } = await supabase
      .from('providers')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error saving provider:', error);
      return null;
    }

    const savedProvider = mapProviderFromDb(data);

    // 2. Log Audit
    try {
        let action: 'Create' | 'Update' = 'Create';
        let changes: Record<string, any> = {};

        if (oldProvider) {
            action = 'Update';
            changes = calculateChanges(oldProvider, savedProvider);
        } else {
            changes = { "all": { old: null, new: "Provider Created" } };
        }

        if (Object.keys(changes).length > 0) {
            await this.saveAuditLog({
                recordId: savedProvider.id,
                entity: 'Provider',
                action,
                changes,
                performedBy,
                timestamp: new Date().toISOString()
            });
        }
    } catch (auditError) {
        console.warn('Failed to save audit log', auditError);
    }

    return savedProvider;
  },

  async getRemittances(providerId?: string): Promise<Remittance[]> {
    let query = supabase.from('remittances').select('*');
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('generated_date', { ascending: false });

    if (error || !data) return MOCK_REMITTANCES.filter(r => !providerId || r.providerId === providerId);

    return data.map((row: any) => ({
      id: row.id,
      providerId: row.provider_id,
      providerName: row.provider_name,
      generatedDate: row.generated_date,
      paymentDate: row.payment_date,
      totalAmount: row.total_amount,
      claimCount: row.claim_count,
      status: row.status,
      reference: row.reference,
      claimsIncluded: row.claims_included || []
    }));
  },

  async createRemittance(remittance: Remittance): Promise<void> {
    const payload = {
      id: remittance.id,
      provider_id: remittance.providerId,
      provider_name: remittance.providerName,
      generated_date: remittance.generatedDate,
      payment_date: remittance.paymentDate,
      total_amount: remittance.totalAmount,
      claim_count: remittance.claimCount,
      status: remittance.status,
      reference: remittance.reference,
      claims_included: remittance.claimsIncluded
    };

    const { error } = await supabase.from('remittances').insert(payload);
    if (error) console.error('Error creating remittance', error);
  },

  // Audit Logs
  async saveAuditLog(log: AuditLog): Promise<void> {
    await supabase.from('audit_logs').insert({
      record_id: log.recordId,
      entity: log.entity,
      action: log.action,
      changes: log.changes,
      performed_by: log.performedBy,
      timestamp: log.timestamp
    });
  },

  async getAuditLogs(providerId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', providerId)
        .order('timestamp', { ascending: false });
    
    if (error) return [];

    return data.map((row: any) => ({
        id: row.id,
        recordId: row.record_id,
        entity: row.entity,
        action: row.action,
        changes: row.changes,
        performedBy: row.performed_by,
        timestamp: row.timestamp
    }));
  }
};
