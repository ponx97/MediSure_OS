
import { api } from './api';
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
  
  bankingDetails: row.banking_details || { bankName: '', branchCode: '', accountNumber: '' },
  dependants: row.dependants || [],
  agentIds: row.agent_ids || [],
  medicalHistory: row.medical_history || { conditions: [], allergies: [], medications: [] },
  
  photoUrl: row.photo_url,
  applicationFormUrl: row.application_form_url,
  
  premiumPayer: row.premium_payer,
  premiumPayerId: row.premium_payer_id,
  policyId: row.policy_id,
  joinDate: row.join_date,
  balance: row.balance ? Number(row.balance) : 0,
});

const mapToDb = (member: Member) => {
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
    
    banking_details: member.bankingDetails,
    dependants: member.dependants,
    agent_ids: member.agentIds,
    medical_history: member.medicalHistory,

    photo_url: member.photoUrl,
    application_form_url: member.applicationFormUrl,
    
    premium_payer: member.premiumPayer,
    premium_payer_id: member.premiumPayerId,
    policy_id: member.policyId,
    join_date: member.joinDate,
    balance: member.balance,
  };
};

export const memberService = {
  async getAll(): Promise<Member[]> {
    const data = await api.get('/members');
    if (!data) {
      console.warn('API fetch failed, falling back to mock data');
      return MOCK_MEMBERS;
    }
    return data.map(mapFromDb);
  },

  async save(member: Member): Promise<Member | null> {
    const dbPayload = mapToDb(member);
    const data = await api.post('/members', dbPayload);
    
    if (!data) {
      console.warn('Falling back to local mock data update.');
      return { ...member, id: dbPayload.id };
    }
    return mapFromDb(data);
  },

  async bulkUpdateStatus(ids: string[], status: 'Active' | 'Suspended' | 'Terminated'): Promise<void> {
    await api.post('/members/bulk-status', { ids, status });
  },

  async uploadFile(file: File, path: string): Promise<string | null> {
    // In a real VPS setup, this would upload to an S3 compatible store or local fs served via nginx
    // For this demo, we simulate success
    console.log(`[Simulated Upload] File ${file.name} to ${path}`);
    return URL.createObjectURL(file);
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    // Optional: implement audit log endpoint
    console.log('Audit Log:', log);
  },

  async getAuditLogs(recordId: string): Promise<AuditLog[]> {
    return [];
  }
};
