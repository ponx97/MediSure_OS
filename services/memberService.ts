
import { supabase } from './supabaseClient';
import { Member, AuditLog } from '../types';
import { MOCK_MEMBERS } from './mockData';

// Helper to map DB columns (snake_case) to Frontend types (camelCase)
const mapFromDb = (row: any): Member => ({
  id: row.id,
  firstName: row.first_name,
  middleName: row.middle_name,
  lastName: row.last_name,
  email: row.email,
  idNumber: row.id_number,
  dob: row.dob,
  maritalStatus: row.marital_status,
  employeeNumber: row.employee_number,
  address: row.address,
  phoneNumber: row.phone_number,
  gender: row.gender,
  status: row.status,
  
  // JSONB fields
  bankingDetails: row.banking_details || { bankName: '', branchCode: '', accountNumber: '' },
  dependants: row.dependants || [],
  agentIds: row.agent_ids || [],
  medicalHistory: row.medical_history || { conditions: [], allergies: [], medications: [] },
  
  // Files
  photoUrl: row.photo_url,
  applicationFormUrl: row.application_form_url,
  
  // Product info
  premiumPayer: row.premium_payer,
  premiumPayerId: row.premium_payer_id, // Added mapping
  policyId: row.policy_id,
  joinDate: row.join_date,
  balance: row.balance || 0,
});

const mapToDb = (member: Member) => {
  // Ensure we have a valid ID for the database
  // If the ID is missing or temporary (from frontend generation), create a persistent one.
  const dbId = (!member.id || member.id.startsWith('MEM-TEMP')) 
    ? `MEM-${Date.now()}` 
    : member.id;

  return {
    id: dbId,
    first_name: member.firstName,
    middle_name: member.middleName,
    last_name: member.lastName,
    email: member.email,
    id_number: member.idNumber,
    dob: member.dob,
    marital_status: member.maritalStatus,
    employee_number: member.employeeNumber,
    address: member.address,
    phone_number: member.phoneNumber,
    gender: member.gender,
    status: member.status,
    
    // JSONB fields
    banking_details: member.bankingDetails,
    dependants: member.dependants,
    agent_ids: member.agentIds,
    medical_history: member.medicalHistory,

    // Files
    photo_url: member.photoUrl,
    application_form_url: member.applicationFormUrl,
    
    // Product info
    premium_payer: member.premiumPayer,
    premium_payer_id: member.premiumPayerId, // Added mapping
    policy_id: member.policyId,
    join_date: member.joinDate,
    balance: member.balance,
  };
};

export const memberService = {
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed (likely missing key), falling back to mock data:', error.message);
      return MOCK_MEMBERS;
    }

    return data.map(mapFromDb);
  },

  async save(member: Member): Promise<Member | null> {
    const dbPayload = mapToDb(member);
    
    try {
      const { data, error } = await supabase
        .from('members')
        .upsert(dbPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return mapFromDb(data);
    } catch (error: any) {
      console.error('Error saving member to Supabase:', error.message || JSON.stringify(error));
      
      // Fallback: Update mock data in memory so the demo works
      console.warn('Falling back to local mock data update.');
      const existingIndex = MOCK_MEMBERS.findIndex(m => m.id === member.id);
      
      const savedMember = { ...member, id: dbPayload.id };
      
      if (existingIndex >= 0) {
        MOCK_MEMBERS[existingIndex] = savedMember;
      } else {
        MOCK_MEMBERS.unshift(savedMember);
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return savedMember;
    }
  },

  async bulkUpdateStatus(ids: string[], status: 'Active' | 'Suspended' | 'Terminated'): Promise<void> {
    try {
        const { error } = await supabase
            .from('members')
            .update({ status: status })
            .in('id', ids);

        if (error) throw error;
    } catch (error: any) {
        console.error('Bulk update failed, falling back to mock', error.message);
        // Fallback for mock data
        ids.forEach(id => {
            const m = MOCK_MEMBERS.find(mem => mem.id === id);
            if(m) m.status = status;
        });
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  async uploadFile(file: File, path: string): Promise<string | null> {
    const bucketName = 'member-docs';
    
    try {
      // Attempt to upload directly.
      // NOTE: For this to work in production, you must create a public bucket named 'member-docs' 
      // in your Supabase Dashboard -> Storage.
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, { upsert: true });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

      return publicUrl;
    } catch (e: any) {
      // Check for specific "Bucket not found" error
      const isBucketMissing = e.message && (
        e.message.includes('Bucket not found') || 
        e.message.includes('The resource was not found')
      );

      if (isBucketMissing) {
        console.warn(`[Demo Notice] Storage bucket '${bucketName}' does not exist on Supabase.`);
        console.info(`To fix: Go to Supabase Dashboard -> Storage -> Create new bucket -> Name it '${bucketName}' -> Toggle 'Public bucket' -> Save.`);
      } else {
        console.error('File upload error:', e.message || e);
      }
      
      // Fallback to local object URL so the UI continues to work for the user
      console.log('Using local object URL for display.');
      return URL.createObjectURL(file);
    }
  },

  // --- Audit Trail Methods ---

  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        record_id: log.recordId,
        entity: log.entity,
        action: log.action,
        changes: log.changes,
        performed_by: log.performedBy,
        timestamp: log.timestamp
      });

      if (error) {
          // If table doesn't exist, we just warn in console for the demo
          console.warn('Supabase audit log insert failed (Table likely missing):', error.message);
      }
    } catch (err) {
      console.warn('Audit log save exception:', err);
    }
  },

  async getAuditLogs(recordId: string): Promise<AuditLog[]> {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('record_id', recordId)
            .order('timestamp', { ascending: false });
        
        if (error) throw error;
        
        return data.map((row: any) => ({
            id: row.id,
            recordId: row.record_id,
            entity: row.entity,
            action: row.action,
            changes: row.changes,
            performedBy: row.performed_by,
            timestamp: row.timestamp
        }));
    } catch (e) {
        // Return empty if table missing
        return [];
    }
  }
};
