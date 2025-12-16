
import { Member, Policy, Claim, Provider, User, Benefit, MedicalCode, ProviderContract, Remittance, ProviderDiscipline, PremiumPayer, Invoice, Payment, PayerDocument, Agent, Commission, CommissionRule } from '../types';

export const MOCK_PROVIDER_DISCIPLINES: ProviderDiscipline[] = [
    { id: 'PD-001', code: '010', name: 'General Practitioner', description: 'Primary care physician services', status: 'Active' },
    { id: 'PD-002', code: '020', name: 'Pathology', description: 'Laboratory analysis and testing', status: 'Active' },
    { id: 'PD-003', code: '030', name: 'Radiology', description: 'Diagnostic imaging services (X-Ray, MRI, CT)', status: 'Active' },
    { id: 'PD-004', code: '040', name: 'Pharmacy', description: 'Medication dispensing services', status: 'Active' },
    { id: 'PD-005', code: '050', name: 'Dentistry', description: 'Dental care and oral surgery', status: 'Active' },
    { id: 'PD-006', code: '060', name: 'Optometry', description: 'Eye care and vision services', status: 'Active' },
    { id: 'PD-007', code: '070', name: 'Specialist Physician', description: 'Specialized medical care', status: 'Active' },
    { id: 'PD-008', code: '080', name: 'Hospital', description: 'In-patient and emergency services', status: 'Active' },
];

export const MOCK_BENEFITS: Benefit[] = [
  { id: 'BEN-001', name: 'GP Consultations', description: 'Face-to-face consultations with a GP network provider.', limitType: 'Count' },
  { id: 'BEN-002', name: 'Acute Medication', description: 'Prescribed medication for acute conditions.', limitType: 'Amount' },
  { id: 'BEN-003', name: 'Basic Dentistry', description: 'Cleaning, fillings, and extractions.', limitType: 'Amount' },
  { id: 'BEN-004', name: 'Optometry', description: 'Eye test and glasses.', limitType: 'Amount' },
  { id: 'BEN-005', name: 'Surgery Co-payment', description: 'Member co-payment required for elective procedures.', limitType: 'Percentage' },
  { id: 'BEN-006', name: 'Maternity Scan', description: 'Ultrasound scans during pregnancy.', limitType: 'Count' },
  { id: 'BEN-007', name: 'In-patient Benefit', description: 'Hospitalization coverage.', limitType: 'Amount' },
];

export const MOCK_POLICIES: Policy[] = [
  {
    id: 'POL-001',
    name: 'Premier Gold Care',
    type: 'Gold',
    currency: 'USD',
    premium: {
        adult: 450,
        child: 200,
        senior: 600
    },
    coverageLimit: 100000,
    copay: 0,
    features: ['Worldwide Coverage', 'Private Room', 'Maternity'],
    benefits: [
      { benefitId: 'BEN-001', limit: 999 }, // Unlimited
      { benefitId: 'BEN-002', limit: 10000 },
      { benefitId: 'BEN-003', limit: 5000 },
      { benefitId: 'BEN-004', limit: 1000 },
      { benefitId: 'BEN-005', limit: 0 },
      { benefitId: 'BEN-007', limit: 100000 },
    ]
  },
  {
    id: 'POL-002',
    name: 'Essential Silver',
    type: 'Silver',
    currency: 'USD',
    premium: {
        adult: 250,
        child: 120,
        senior: 350
    },
    coverageLimit: 50000,
    copay: 10,
    features: ['Local Specialist Access', 'Semi-Private Room'],
    benefits: [
      { benefitId: 'BEN-001', limit: 12 },
      { benefitId: 'BEN-002', limit: 5000 },
      { benefitId: 'BEN-003', limit: 2500 },
      { benefitId: 'BEN-004', limit: 400 },
      { benefitId: 'BEN-005', limit: 10 },
      { benefitId: 'BEN-007', limit: 50000 },
    ]
  },
  {
    id: 'POL-003',
    name: 'Basic Bronze',
    type: 'Bronze',
    currency: 'ZWG',
    premium: {
        adult: 2400, // ZWG value example
        child: 1200,
        senior: 3000
    },
    coverageLimit: 300000, // ZWG
    copay: 20,
    features: ['Emergency Care'],
    benefits: [
      { benefitId: 'BEN-001', limit: 6 },
      { benefitId: 'BEN-002', limit: 1500 },
      { benefitId: 'BEN-003', limit: 0 },
      { benefitId: 'BEN-004', limit: 0 },
      { benefitId: 'BEN-005', limit: 20 },
    ]
  }
];

export const MOCK_PAYERS = [
  'Self',
  'Tech Corp Inc',
  'City Services',
  'Trust Fund A',
  'Spouse'
];

export const MOCK_PREMIUM_PAYERS: PremiumPayer[] = [
    {
        id: 'PAY-001',
        name: 'Tech Corp Inc',
        type: 'Group',
        address: '123 Tech Park, Silicon Vlei',
        contactPerson: 'Alice HR',
        phone: '+263 777 123 456',
        email: 'hr@techcorp.co.zw',
        paymentTerms: '30 Days',
        status: 'Active'
    },
    {
        id: 'PAY-002',
        name: 'City Services',
        type: 'Group',
        address: '45 Civic Center, Downtown',
        contactPerson: 'Bob Municipal',
        phone: '+263 777 987 654',
        email: 'finance@cityservices.org',
        paymentTerms: '60 Days',
        status: 'Active'
    },
    {
        id: 'PAY-003',
        name: 'John Doe (Individual)',
        type: 'Individual',
        address: '123 Maple Ave',
        contactPerson: 'John Doe',
        phone: '+1 555 0123',
        email: 'john.doe@example.com',
        paymentTerms: 'Current',
        status: 'Active'
    }
];

export const MOCK_INVOICES: Invoice[] = [
    { id: 'INV-2024-001', payerId: 'PAY-001', invoiceDate: '2024-06-01', dueDate: '2024-07-01', totalAmount: 15400, paidAmount: 15400, status: 'Paid', period: 'June 2024' },
    { id: 'INV-2024-002', payerId: 'PAY-001', invoiceDate: '2024-07-01', dueDate: '2024-08-01', totalAmount: 15600, paidAmount: 0, status: 'Unpaid', period: 'July 2024' },
    { id: 'INV-2024-003', payerId: 'PAY-002', invoiceDate: '2024-06-01', dueDate: '2024-08-01', totalAmount: 8500, paidAmount: 4000, status: 'Partial', period: 'June 2024' }
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'MEM-1001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    status: 'Active',
    policyId: 'POL-001',
    joinDate: '2023-01-15',
    policyEndDate: '2024-12-31',
    dob: '1985-05-12',
    gender: 'Male',
    phoneNumber: '+263 777 000 001',
    address: '123 Samora Machel Ave, Harare',
    idNumber: '63-123456-F-12',
    maritalStatus: 'Single',
    premiumPayer: 'Self',
    agentIds: ['AGT-001'],
    balance: 0,
    bankingDetails: { bankName: 'Standard Chartered', branchCode: '001', accountNumber: '123456789' },
    dependants: [
      { id: 'DEP-001', firstName: 'Jane', lastName: 'Doe', dob: '2015-06-01', idNumber: '63-999888-F-12', relationship: 'Child', joinDate: '2023-01-15', gender: 'Female', status: 'Active' }
    ]
  },
  {
    id: 'MEM-1002',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.c@example.com',
    status: 'Suspended',
    policyId: 'POL-002',
    joinDate: '2023-06-10',
    dob: '1990-08-23',
    gender: 'Female',
    phoneNumber: '+263 777 000 002',
    address: '45 Borrowdale Rd, Harare',
    idNumber: '42-123456-V-55',
    maritalStatus: 'Married',
    premiumPayer: 'Tech Corp Inc',
    agentIds: [],
    balance: 50,
    bankingDetails: { bankName: 'CABS', branchCode: '002', accountNumber: '987654321' },
    dependants: []
  }
];

export const MOCK_CLAIMS: Claim[] = [
  {
    id: 'CLM-2024-001',
    memberId: 'MEM-1001',
    patientName: 'John Doe',
    memberName: 'John Doe',
    providerId: 'PRV-001',
    providerName: 'City General Hospital',
    serviceDate: '2024-06-15',
    submissionDate: '2024-06-16',
    diagnosisCode: 'J01.90',
    procedureCode: '99213',
    amountBilled: 150.00,
    amountApproved: 120.00,
    status: 'Approved',
    description: 'Acute Sinusitis consultation and medication.',
    aiAnalysis: 'Diagnosis consistent with treatment. Within policy limits.'
  },
  {
    id: 'CLM-2024-002',
    memberId: 'MEM-1002',
    patientName: 'Sarah Connor',
    memberName: 'Sarah Connor',
    providerId: 'PRV-002',
    providerName: 'Dr. A. Smith',
    serviceDate: '2024-06-18',
    submissionDate: '2024-06-19',
    diagnosisCode: 'M54.5',
    procedureCode: '97110',
    amountBilled: 85.00,
    amountApproved: 0.00,
    status: 'Pending',
    description: 'Physiotherapy for lower back pain.'
  },
  {
    id: 'CLM-2024-003',
    memberId: 'MEM-1001',
    patientName: 'Jane Doe',
    memberName: 'John Doe',
    providerId: 'PRV-003',
    providerName: 'MediPharmacy',
    serviceDate: '2024-06-10',
    submissionDate: '2024-06-11',
    diagnosisCode: 'Z00.00',
    procedureCode: 'MED-001',
    amountBilled: 45.00,
    amountApproved: 45.00,
    status: 'Paid',
    description: 'Prescription medication.'
  }
];

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'PRV-001',
    name: 'City General Hospital',
    discipline: 'Hospital',
    type: 'Hospital',
    status: 'Active',
    afhozNumber: 'AF-2020-001',
    licenseNumber: 'HOSP-001',
    taxClearanceExpiry: '2024-12-31',
    address: '1 Hospital Rd, Harare',
    primaryContactPerson: 'Dr. Chief',
    primaryContactPhone: '+263 777 111 222',
    email: 'admin@cityhospital.co.zw',
    bankingDetails: { bankName: 'Stanbic', branchCode: '041', accountNumber: '1122334455' },
    location: 'Harare'
  },
  {
    id: 'PRV-002',
    name: 'Dr. A. Smith',
    discipline: 'General Practitioner',
    type: 'Individual',
    status: 'Active',
    afhozNumber: 'AF-2015-123',
    licenseNumber: 'MD-9988',
    taxClearanceExpiry: '2025-01-31',
    address: 'Suite 5, Medical Chambers',
    primaryContactPerson: 'Dr. Smith',
    primaryContactPhone: '+263 777 333 444',
    email: 'dr.smith@medichambers.co.zw',
    bankingDetails: { bankName: 'CABS', branchCode: '002', accountNumber: '5566778899' },
    location: 'Bulawayo'
  },
  {
    id: 'PRV-003',
    name: 'MediPharmacy',
    discipline: 'Pharmacy',
    type: 'Pharmacy',
    status: 'Suspended',
    afhozNumber: 'AF-2019-999',
    licenseNumber: 'PH-1122',
    taxClearanceExpiry: '2023-12-31',
    address: 'Shop 10, Westgate Mall',
    primaryContactPerson: 'Pharm. Jones',
    primaryContactPhone: '+263 777 555 666',
    email: 'info@medipharm.co.zw',
    bankingDetails: { bankName: 'NMB', branchCode: '005', accountNumber: '9900112233' },
    location: 'Harare'
  }
];

export const MOCK_USERS: User[] = [
    { id: 'USR-001', name: 'Admin User', email: 'admin@medisure.co.zw', role: 'ADMIN', avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0d9488&color=fff' },
    { id: 'USR-002', name: 'Claims Agent', email: 'claims@medisure.co.zw', role: 'AGENT', avatarUrl: 'https://ui-avatars.com/api/?name=Claims+Agent&background=3b82f6&color=fff' },
    { id: 'USR-003', name: 'Dr. Smith', email: 'dr.smith@medichambers.co.zw', role: 'PROVIDER', avatarUrl: 'https://ui-avatars.com/api/?name=Dr+Smith&background=8b5cf6&color=fff' },
    { id: 'USR-004', name: 'John Doe', email: 'john.doe@example.com', role: 'MEMBER', avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=f59e0b&color=fff' },
];

export const MOCK_MEDICAL_CODES: MedicalCode[] = [
    { id: 'MC-001', code: '99213', description: 'Office or other outpatient visit for the evaluation and management of an established patient', type: 'ZRVS', price: 35.00, effectiveDate: '2024-01-01', status: 'Active', category: 'Consultation', disciplineId: 'PD-001' },
    { id: 'MC-002', code: 'J01.90', description: 'Acute sinusitis, unspecified', type: 'ICD10', effectiveDate: '2024-01-01', status: 'Active', category: 'Diagnosis' },
    { id: 'MC-003', code: 'M54.5', description: 'Low back pain', type: 'ICD10', effectiveDate: '2024-01-01', status: 'Active', category: 'Diagnosis' },
    { id: 'MC-004', code: '97110', description: 'Therapeutic procedure, 1 or more areas, each 15 minutes', type: 'ZRVS', price: 25.00, effectiveDate: '2024-01-01', status: 'Active', category: 'Physiotherapy', disciplineId: 'PD-007' }
];

export const MOCK_CONTRACTS: ProviderContract[] = [
    {
        id: 'CTR-001',
        providerId: 'PRV-001',
        providerName: 'City General Hospital',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        tariffModel: 'Standard',
        tariffMultiplier: 1.0,
        status: 'Active'
    }
];

export const MOCK_REMITTANCES: Remittance[] = [
    {
        id: 'REM-1001',
        providerId: 'PRV-001',
        providerName: 'City General Hospital',
        generatedDate: '2024-05-31',
        paymentDate: '2024-06-05',
        totalAmount: 15400.00,
        claimCount: 45,
        status: 'Paid',
        reference: 'EFT-998877',
        claimsIncluded: []
    },
    {
        id: 'REM-1002',
        providerId: 'PRV-002',
        providerName: 'Dr. A. Smith',
        generatedDate: '2024-06-15',
        totalAmount: 3200.00,
        claimCount: 12,
        status: 'Processing',
        reference: '',
        claimsIncluded: []
    }
];
