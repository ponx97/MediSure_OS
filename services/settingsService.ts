
import { supabase } from './supabaseClient';
import { MedicalCode, ProviderDiscipline } from '../types';
import { MOCK_MEDICAL_CODES, MOCK_PROVIDER_DISCIPLINES } from './mockData';

export const settingsService = {
  // --- Medical Codes ---
  async getMedicalCodes(): Promise<MedicalCode[]> {
    const { data, error } = await supabase
      .from('medical_codes')
      .select('*')
      .order('code', { ascending: true });

    // For medical codes, we keep the fallback just in case, or you can remove it too.
    // Leaving as is to focus on the requested "Provider Discipline" change.
    if (error || !data || data.length === 0) return MOCK_MEDICAL_CODES;

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      type: row.type,
      price: row.price,
      effectiveDate: row.effective_date,
      category: row.category,
      status: row.status,
      benefitId: row.benefit_id,
      disciplineId: row.discipline_id 
    }));
  },

  async saveMedicalCode(code: MedicalCode): Promise<void> {
    const payload = {
      id: code.id,
      code: code.code,
      description: code.description,
      type: code.type,
      price: code.price,
      effective_date: code.effectiveDate,
      category: code.category,
      status: code.status,
      benefit_id: code.benefitId,
      discipline_id: code.disciplineId
    };
    await supabase.from('medical_codes').upsert(payload);
  },

  async seedMedicalCodes(): Promise<void> {
    const payload = MOCK_MEDICAL_CODES.map(code => ({
      id: code.id,
      code: code.code,
      description: code.description,
      type: code.type,
      price: code.price,
      effective_date: code.effectiveDate,
      category: code.category,
      status: code.status,
      benefit_id: code.benefitId,
      discipline_id: code.disciplineId
    }));

    const { error } = await supabase.from('medical_codes').upsert(payload);
    if (error) throw error;
  },

  // --- Disciplines ---
  async getDisciplines(): Promise<ProviderDiscipline[]> {
    // CONNECTED: Fetch directly from Supabase 'provider_disciplines' table
    const { data, error } = await supabase
      .from('provider_disciplines')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching disciplines from Supabase:', error.message);
      return [];
    }

    // Return the actual data from the DB (even if empty) to prove connection
    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      status: row.status
    }));
  },

  async saveDiscipline(disc: ProviderDiscipline): Promise<void> {
    const payload = {
      id: disc.id,
      code: disc.code,
      name: disc.name,
      description: disc.description,
      status: disc.status
    };
    
    // CONNECTED: Write directly to Supabase
    const { error } = await supabase.from('provider_disciplines').upsert(payload);
    if (error) {
        console.error('Error saving discipline:', error.message);
        throw error;
    }
  },

  async seedDisciplines(): Promise<void> {
    // Helper to populate the DB with initial mock data
    const payload = MOCK_PROVIDER_DISCIPLINES.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        status: d.status
    }));
    const { error } = await supabase.from('provider_disciplines').upsert(payload);
    if (error) throw error;
  }
};
