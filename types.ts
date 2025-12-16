
export type Role = 'ADMIN' | 'MEMBER' | 'PROVIDER' | 'AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface PolicyBenefitLink {
  benefitId: string;
  limit: number;
}

export interface PolicyPremiums {
  adult: number;
  child: number;
  senior: number;
}

export interface Policy {
  id: string;
  name: string;
  type: 'Gold' | 'Silver' | 'Bronze';
  currency: 'USD' | 'ZWG' | 'ZAR';
  premium: PolicyPremiums; // Structured premiums
  coverageLimit: number; // Annual limit
  copay: number; // Percentage
  features: string[]; // Legacy text features
  benefits: PolicyBenefitLink[]; // Structured benefits with specific limits
}

export interface BankingDetails {
  bankName: string;
  branchCode: string;
  accountNumber: string;
  accountHolder?: string;
}

export interface Dependant {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  idNumber: string;
  relationship: string;
  joinDate: string;
  gender: 'Male' | 'Female' | 'Other';
  photoUrl?: string;
  status?: 'Active' | 'Suspended';
}

export interface MedicalCondition {
  id: string;
  name: string;
  diagnosedDate: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface MedicalHistory {
  conditions: MedicalCondition[];
  allergies: Allergy[];
  medications: Medication[];
}

export interface Member {
  id: string;
  userId?: string; // Optional link to auth user
  
  // Personal Info
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  idNumber: string;
  dob: string;
  maritalStatus: string;
  employeeNumber?: string;
  address: string;
  phoneNumber: string;
  gender: string;
  bankingDetails: BankingDetails;
  photoUrl?: string;
  applicationFormUrl?: string;

  // Product
  premiumPayer: string;
  premiumPayerId?: string; // Link to PremiumPayer table
  policyId: string;
  joinDate: string;
  policyEndDate?: string; // New field for Renewal Engine
  agentIds: string[]; // IDs of selected agents
  
  // Dependants & Status
  dependants: Dependant[];
  status: 'Active' | 'Suspended' | 'Terminated' | 'Pending';
  
  // Medical History
  medicalHistory?: MedicalHistory;
  
  // Computed/Legacy
  balance: number; // Global balance for backward compatibility or display
}

export interface Claim {
  id: string;
  memberId: string; // The Principal Member ID
  patientName: string; // The specific person (Principal or Dependant) who received care
  memberName: string; // Keeping for backward compatibility (usually Principal name)
  providerId: string;
  providerName: string;
  serviceDate: string;
  submissionDate: string;
  diagnosisCode: string; // ICD-10
  procedureCode: string;
  amountBilled: number;
  amountApproved: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  description: string;
  notes?: string;
  aiAnalysis?: string;
  
  // Audit Trail
  capturedBy?: string;
  approvedBy?: string;
}

export interface Provider {
  id: string;
  name: string;
  discipline: string; // e.g., General Practitioner, Pharmacy
  type: string; // Legacy broad category for UI grouping if needed
  status: 'Active' | 'Pending' | 'Suspended' | 'Inactive';
  
  // Registration & Compliance
  afhozNumber: string;
  licenseNumber: string;
  taxClearanceExpiry: string;
  taxClearanceUrl?: string;

  // Contact Info
  address: string;
  primaryContactPerson: string;
  primaryContactPhone: string;
  email: string;

  // Financial
  bankingDetails: BankingDetails;
  
  // Additional
  location: string; // City/Area for quick display
  accreditationLevel?: 'Gold' | 'Silver' | 'Standard';
  joinedDate?: string;
}

export interface ProviderContract {
  id: string;
  providerId: string;
  providerName: string;
  startDate: string;
  endDate: string;
  tariffModel: 'Standard' | 'Network' | 'Premium' | 'Capitation';
  tariffMultiplier: number; // e.g., 1.0, 1.10
  status: 'Active' | 'Expired' | 'Draft' | 'Negotiating';
  termsUrl?: string;
}

export interface Remittance {
  id: string;
  providerId: string;
  providerName: string;
  generatedDate: string;
  paymentDate?: string;
  totalAmount: number;
  claimCount: number;
  status: 'Paid' | 'Processing' | 'Failed';
  reference: string;
  claimsIncluded: string[]; // List of Claim IDs
}

export interface WidgetStat {
  label: string;
  value: string | number;
  change: number; // Percentage
  trend: 'up' | 'down' | 'neutral';
}

export interface AuditLog {
  id?: string;
  recordId: string;
  entity: 'Member' | 'Claim' | 'Policy' | 'Provider' | 'Agent' | 'Commission';
  action: 'Create' | 'Update' | 'Delete' | 'Renew';
  changes: Record<string, { old: any; new: any }>;
  performedBy: string; // Name or ID of user
  timestamp: string;
}

export type BenefitLimitType = 'Amount' | 'Percentage' | 'Count';

export interface Benefit {
  id: string;
  name: string;
  description: string;
  limitType: BenefitLimitType;
}

export type MedicalCodeType = 'ZRVS' | 'Dental' | 'Ancillary' | 'ICD10' | 'Optometry' | 'Drug';

export interface MedicalCode {
  id: string;
  code: string;
  description: string;
  type: MedicalCodeType;
  price?: number; // Not applicable for ICD10
  effectiveDate: string;
  category?: string;
  status?: 'Active' | 'Inactive';
  benefitId?: string;
  disciplineId?: string; // New field
}

export interface RenewalConfig {
    defaultDurationMonths: number;
    notificationDays: number; // Days before expiry to notify
    autoRenew: boolean;
    gracePeriodDays: number;
}

export interface ProviderDiscipline {
    id: string;
    code: string;
    name: string;
    description: string;
    status: 'Active' | 'Inactive';
}

export interface PremiumPayer {
  id: string;
  name: string;
  type: 'Individual' | 'Group';
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  taxId?: string;
  paymentTerms: 'Current' | '30 Days' | '60 Days' | '90 Days';
  status: 'Active' | 'Inactive';
}

export interface Payment {
    id: string;
    payerId: string;
    amount: number;
    method: 'Bank Transfer' | 'Online' | 'Mobile Money' | 'Cash';
    date: string;
    reference: string;
    status: 'Allocated' | 'Unallocated' | 'Partial';
    allocatedToInvoiceId?: string;
}

export interface Invoice {
    id: string;
    payerId: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    status: 'Paid' | 'Unpaid' | 'Partial' | 'Overdue';
    period: string; // e.g., "June 2024"
    billingRunId?: string;
}

export interface PayerDocument {
    id: string;
    payerId: string;
    name: string;
    type: 'Statement' | 'Receipt' | 'Invoice' | 'Report';
    date: string;
    size: string;
    url?: string;
}

// --- Agent & Commission Module Types ---

export type AgentType = 'Individual' | 'Broker' | 'Internal';
export type AgentStatus = 'Active' | 'Suspended' | 'Terminated';

export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    nrcId: string; // National ID or Registration #
    email: string;
    phone: string;
    address: string;
    taxId?: string;
    bankDetails: BankingDetails;
    status: AgentStatus;
    dateOnboarded: string;
    commissionBalance: number; // Calculated field
}

export type CommissionStatus = 'Pending' | 'Approved' | 'Payable' | 'Paid' | 'Reversed';
export type CommissionType = 'Percentage' | 'Fixed' | 'Tiered';

export interface CommissionRule {
    id: string;
    name: string;
    description: string;
    type: CommissionType;
    value: number; // % or Fixed Amount
    agentType: AgentType | 'All'; // Applies to
    productType?: 'Gold' | 'Silver' | 'Bronze' | 'All';
    isActive: boolean;
}

export interface Commission {
    id: string;
    agentId: string;
    agentName: string;
    referenceId: string; // e.g., Invoice ID or Payment ID
    sourceEntity: string; // e.g., "Member Premium - John Doe"
    amount: number;
    calculationDate: string;
    status: CommissionStatus;
    ruleApplied: string; // Name of rule
    paymentReference?: string; // If Paid, the batch/transaction ID
    paymentDate?: string;
}

// --- Automation & Scheduling ---

export interface MonthlyRun {
    id: string;
    runType: 'COMMISSION' | 'PREMIUM_RECON' | 'ACCOUNTING_CLOSE';
    runMonth: string; // 'YYYY-MM'
    targetRunDate: string; // The specific date (10th or next Monday)
    executedAt: string;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    triggeredBy: string;
    resultSummary: any; // JSONB
}

// --- Billing ---

export interface BillingRun {
    id: string;
    runDate: string;
    billingPeriod: string;
    payerType: 'Individual' | 'Group';
    strategy: string;
    invoicesGenerated: number;
    totalAmount: number;
    status: 'Pending' | 'Completed' | 'Failed';
    logs: string[];
}

// --- Accounting Module ---

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    category: string;
    isSystem: boolean;
    balance?: number; // Calculated
}

export interface JournalLine {
    id: string;
    accountId: string;
    accountName?: string; // Joined for display
    accountCode?: string; // Joined for display
    description: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    transactionDate: string;
    description: string;
    referenceId?: string;
    sourceModule: string;
    status: 'Posted' | 'Reversed';
    totalAmount: number;
    lines: JournalLine[];
}

export interface AccountingPeriod {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'Open' | 'Closed' | 'Locked';
}
