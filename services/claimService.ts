
import { supabase } from './supabaseClient';
import { Claim } from '../types';
import { MOCK_CLAIMS } from './mockData';
import { accountingService } from './accountingService';

const mapClaimFromDb = (row: any): Claim => ({
  id: row.id,
  memberId: row.member_id,
  patientName: row.patient_name,
  memberName: row.member_name,
  providerId: row.provider_id,
  providerName: row.provider_name,
  serviceDate: row.service_date,
  submissionDate: row.submission_date,
  diagnosisCode: row.diagnosis_code,
  procedureCode: row.procedure_code,
  amountBilled: row.amount_billed,
  amountApproved: row.amount_approved,
  status: row.status,
  description: row.description,
  notes: row.notes,
  aiAnalysis: row.ai_analysis,
  capturedBy: row.captured_by,
  approvedBy: row.approved_by,
});

export const claimService = {
  async getAll(): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .order('submission_date', { ascending: false });

    if (error) {
      console.error('Error fetching claims:', error);
      return MOCK_CLAIMS;
    }
    return data.map(mapClaimFromDb);
  },

  async getByProvider(providerId: string): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('provider_id', providerId)
      .order('service_date', { ascending: false });

    if (error) {
       // Fallback for demo
       return MOCK_CLAIMS.filter(c => c.providerId === providerId);
    }
    return data.map(mapClaimFromDb);
  },

  async updateStatus(claimId: string, status: 'Paid' | 'Approved' | 'Rejected', updates?: Partial<Claim>): Promise<void> {
    const payload: any = { status, ...updates };
    
    // Map updates to snake_case if needed
    if (updates?.amountApproved !== undefined) payload.amount_approved = updates.amountApproved;
    if (updates?.approvedBy) payload.approved_by = updates.approvedBy;

    await supabase.from('claims').update(payload).eq('id', claimId);

    // ACCOUNTING HOOK: Claim Approved
    if (status === 'Approved') {
        // Fetch claim details to get amount and provider
        const { data: claim } = await supabase.from('claims').select('*').eq('id', claimId).single();
        if (claim) {
            await accountingService.postClaimApprovedEvent(claim.id, claim.amount_approved, claim.provider_name);
        }
    }
  },

  async create(claim: Claim): Promise<Claim | null> {
      const payload = {
          id: claim.id,
          member_id: claim.memberId,
          patient_name: claim.patientName,
          member_name: claim.memberName,
          provider_id: claim.providerId,
          provider_name: claim.providerName,
          service_date: claim.serviceDate,
          submission_date: claim.submissionDate,
          diagnosis_code: claim.diagnosisCode,
          procedure_code: claim.procedureCode,
          amount_billed: claim.amountBilled,
          amount_approved: claim.amountApproved,
          status: claim.status,
          description: claim.description,
          captured_by: claim.capturedBy
      };

      const { data, error } = await supabase.from('claims').insert(payload).select().single();
      if(error) {
          console.error(error);
          return null;
      }
      return mapClaimFromDb(data);
  }
};
