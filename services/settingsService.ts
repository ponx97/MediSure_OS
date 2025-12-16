
import { api } from './api';
import { MedicalCode, ProviderDiscipline } from '../types';
import { MOCK_MEDICAL_CODES, MOCK_PROVIDER_DISCIPLINES } from './mockData';

export const settingsService = {
  async getMedicalCodes(): Promise<MedicalCode[]> {
    // Stub - using Mock for now
    return MOCK_MEDICAL_CODES;
  },

  async saveMedicalCode(code: MedicalCode): Promise<void> {
    // Stub
  },

  async seedMedicalCodes(): Promise<void> {
    // Stub
  },

  async getDisciplines(): Promise<ProviderDiscipline[]> {
    // Stub
    return MOCK_PROVIDER_DISCIPLINES;
  },

  async saveDiscipline(disc: ProviderDiscipline): Promise<void> {
    // Stub
  },

  async seedDisciplines(): Promise<void> {
    // Stub
  }
};
