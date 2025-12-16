
import React, { useState, useEffect } from 'react';
import { 
    Upload, 
    Database, 
    Plus, 
    Search, 
    Settings as SettingsIcon, 
    CheckCircle, 
    Loader2, 
    BarChart3, 
    ArrowLeft, 
    Mail, 
    Smartphone, 
    ShieldAlert, 
    Stethoscope, 
    RotateCcw, 
    Clock, 
    UserCheck, 
    CalendarDays, 
    FileUp, 
    RefreshCw,
    Server,
    Play,
    AlertTriangle
} from 'lucide-react';
import { MOCK_MEMBERS } from '../services/mockData';
import { MedicalCode, MedicalCodeType, RenewalConfig, Member, ProviderDiscipline, Benefit, MonthlyRun } from '../types';
import { memberService } from '../services/memberService';
import { settingsService } from '../services/settingsService';
import { policyService } from '../services/policyService';
import { automationService } from '../services/automationService';

// --- Types for new modules ---
interface SMSLog {
    id: string;
    recipient: string;
    message: string;
    status: 'Sent' | 'Failed' | 'Delivered';
    timestamp: string;
}

interface ReportDef {
    id: string;
    name: string;
    category: string;
    lastGenerated: string;
    format: 'PDF' | 'CSV' | 'XLSX';
}

interface LetterTemplate {
    id: string;
    name: string;
    recipientType: 'Member' | 'Provider' | 'Internal';
    lastModified: string;
    status: 'Active' | 'Draft';
}

interface FraudCase {
    id: string;
    subjectName: string;
    subjectType: 'Provider' | 'Member' | 'Staff';
    infraction: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
    dateOpened: string;
}

const Settings: React.FC = () => {
    const [currentView, setCurrentView] = useState<'overview' | 'bulk-upload' | 'medical-codes' | 'sms' | 'reports' | 'letters' | 'fraud' | 'provider-disciplines' | 'policy-renewals' | 'automation'>('overview');

    // --- State: Bulk Upload ---
    const [uploadType, setUploadType] = useState('membership');
    const [dragActive, setDragActive] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // --- State: Medical Codes ---
    const [codeCategory, setCodeCategory] = useState<MedicalCodeType>('ZRVS');
    const [codes, setCodes] = useState<MedicalCode[]>([]);
    const [codeSearch, setCodeSearch] = useState('');
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [newCode, setNewCode] = useState<Partial<MedicalCode>>({ code: '', description: '', price: 0, status: 'Active' });
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // --- State: Lookup Data ---
    const [disciplines, setDisciplines] = useState<ProviderDiscipline[]>([]);
    const [benefits, setBenefits] = useState<Benefit[]>([]);

    // --- State: Database Ops ---
    const [seeding, setSeeding] = useState(false);

    // --- State: Automation ---
    const [automationRuns, setAutomationRuns] = useState<MonthlyRun[]>([]);
    const [runningAutomation, setRunningAutomation] = useState(false);

    // --- State: SMS ---
    const [smsLogs] = useState<SMSLog[]>([
        { id: '1', recipient: '+15550123', message: 'Your claim #CLM-2024-001 has been approved.', status: 'Delivered', timestamp: '2024-06-15 10:30' },
        { id: '2', recipient: '+15550456', message: 'Welcome to MediSure! Download your digital card.', status: 'Sent', timestamp: '2024-06-14 14:20' },
        { id: '3', recipient: '+15550789', message: 'Policy renewal reminder. Due on 2024-07-01.', status: 'Failed', timestamp: '2024-06-12 09:15' },
    ]);

    // --- State: Reports ---
    const [reports] = useState<ReportDef[]>([
        { id: '1', name: 'Monthly Claims Summary', category: 'Financial', lastGenerated: '2024-05-31', format: 'PDF' },
        { id: '2', name: 'Member Demographics', category: 'Membership', lastGenerated: '2024-06-01', format: 'XLSX' },
        { id: '3', name: 'Provider Utilization', category: 'Operational', lastGenerated: '2024-06-10', format: 'CSV' },
        { id: '4', name: 'Outstanding Premiums', category: 'Financial', lastGenerated: '2024-06-15', format: 'PDF' },
    ]);

    // --- State: Letters ---
    const [letters] = useState<LetterTemplate[]>([
        { id: '1', name: 'Membership Confirmation', recipientType: 'Member', lastModified: '2024-01-15', status: 'Active' },
        { id: '2', name: 'Pre-Authorization Approval', recipientType: 'Provider', lastModified: '2023-11-20', status: 'Active' },
        { id: '3', name: 'Claim Rejection Notice', recipientType: 'Member', lastModified: '2024-02-10', status: 'Active' },
        { id: '4', name: 'Provider Suspension Notice', recipientType: 'Provider', lastModified: '2023-12-05', status: 'Draft' },
    ]);

    // --- State: Fraud & Compliance ---
    const [fraudCases] = useState<FraudCase[]>([
        { id: 'CASE-2024-001', subjectName: 'Dr. A. Smith (PRV-501)', subjectType: 'Provider', infraction: 'Upcoding Claims', severity: 'High', status: 'Under Investigation', dateOpened: '2024-06-10' },
        { id: 'CASE-2024-002', subjectName: 'John Doe (MEM-1001)', subjectType: 'Member', infraction: 'Duplicate Claim Submission', severity: 'Low', status: 'Resolved', dateOpened: '2024-05-15' },
        { id: 'CASE-2024-003', subjectName: 'Sarah Connors', subjectType: 'Staff', infraction: 'Unauthorized Data Access', severity: 'Critical', status: 'Closed', dateOpened: '2024-04-20' },
    ]);

    // --- State: Provider Disciplines (Form Only) ---
    const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
    const [newDiscipline, setNewDiscipline] = useState<Partial<ProviderDiscipline>>({ code: '', name: '', description: '', status: 'Active' });

    // --- State: Renewal Engine ---
    const [renewalConfig, setRenewalConfig] = useState<RenewalConfig>({
        defaultDurationMonths: 12,
        notificationDays: 30,
        autoRenew: false,
        gracePeriodDays: 14
    });
    const [membersToRenew, setMembersToRenew] = useState<Member[]>([]); 
    const [renewingMemberId, setRenewingMemberId] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        loadSettings();
        
        // Load members for renewal logic
        const loadMembers = async () => {
            const allMembers = await memberService.getAll();
            setMembersToRenew(allMembers);
        }
        loadMembers();
    }, []);

    const loadSettings = async () => {
        const [codesData, disciplinesData, benefitsData, automationData] = await Promise.all([
            settingsService.getMedicalCodes(),
            settingsService.getDisciplines(),
            policyService.getBenefits(),
            automationService.getMonthlyRuns()
        ]);
        setCodes(codesData);
        setDisciplines(disciplinesData);
        setBenefits(benefitsData);
        setAutomationRuns(automationData);
    };

    // --- Renewal Logic ---
    const getExpiringMembers = () => {
        const today = new Date();
        const notificationThreshold = new Date();
        notificationThreshold.setDate(today.getDate() + renewalConfig.notificationDays);

        return membersToRenew.filter(m => {
            // Restriction: Only apply to Individual payers (Self)
            if (m.premiumPayer !== 'Self') return false;

            if (!m.policyEndDate) return false;
            const endDate = new Date(m.policyEndDate);
            // Show if expired OR expiring soon
            return endDate <= notificationThreshold;
        });
    };

    const handleRenewMember = async (member: Member) => {
        setRenewingMemberId(member.id);
        
        // Calculate new end date
        const currentEnd = member.policyEndDate ? new Date(member.policyEndDate) : new Date();
        // If expired, start from today, else extend current end date
        const startDate = currentEnd < new Date() ? new Date() : currentEnd;
        const newEndDate = new Date(startDate);
        newEndDate.setMonth(newEndDate.getMonth() + renewalConfig.defaultDurationMonths);
        
        const updatedMember: Member = {
            ...member,
            policyEndDate: newEndDate.toISOString().split('T')[0],
            status: 'Active' // Reactivate if suspended/expired
        };

        // Call service (mock save will update local cache)
        await memberService.save(updatedMember);
        
        // Update local state
        setMembersToRenew(prev => prev.map(m => m.id === member.id ? updatedMember : m));
        
        setTimeout(() => setRenewingMemberId(null), 800);
    };

    // --- Handlers: Database Seeding ---
    const handleSeedData = async () => {
        // if (!window.confirm("This will attempt to populate the database with default master data (Disciplines, Policies, Benefits). Continue?")) return;
        setSeeding(true);
        try {
            await Promise.all([
                settingsService.seedDisciplines(),
                policyService.seedPolicies(),
                policyService.seedBenefits(),
                settingsService.seedMedicalCodes()
            ]);
            // alert("Database populated successfully!");
            // Reload data
            await loadSettings();
        } catch (e: any) {
            console.error(e);
            alert("Failed to seed data: " + e.message);
        } finally {
            setSeeding(false);
        }
    };

    // --- Handlers: Automation ---
    const handleTriggerAutomation = async (type: 'COMMISSION' | 'PREMIUM_RECON') => {
        if (!window.confirm(`Manually run ${type} calculation for the current month? This will check scheduling rules and prevent duplicates.`)) return;
        
        setRunningAutomation(true);
        try {
            const run = await automationService.executeMonthlyRun(type, 'Admin User', true); // Force run
            if (run) {
                alert(`Automation ${run.status}: ${run.resultSummary?.notes || ''}`);
                // Reload list
                const runs = await automationService.getMonthlyRuns();
                setAutomationRuns(runs);
            } else {
                alert("This automation has already completed successfully for this month.");
            }
        } catch (e: any) {
            alert("Automation failed: " + e.message);
        } finally {
            setRunningAutomation(false);
        }
    };

    // --- Handlers: Bulk Upload ---
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadedFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    const processUpload = () => {
        if (!uploadedFile) return;
        setUploadStatus('uploading');
        // Simulate API call
        setTimeout(() => {
            setUploadStatus('success');
            setTimeout(() => {
                setUploadStatus('idle');
                setUploadedFile(null);
            }, 3000);
        }, 2000);
    };

    // --- Handlers: Medical Codes ---
    const handleSaveCode = async () => {
        if (!newCode.code || !newCode.price) return;
        setLoadingCodes(true);
        
        const codeToAdd: MedicalCode = {
            id: `MC-${Date.now()}`,
            code: newCode.code || '',
            description: newCode.description || '',
            type: codeCategory,
            price: Number(newCode.price),
            effectiveDate: new Date().toISOString().split('T')[0],
            status: 'Active',
            category: 'General',
            disciplineId: newCode.disciplineId,
            benefitId: newCode.benefitId
        };

        await settingsService.saveMedicalCode(codeToAdd);
        setCodes([...codes, codeToAdd]);
        
        setLoadingCodes(false);
        setIsCodeModalOpen(false);
        setNewCode({ code: '', description: '', price: 0, status: 'Active', disciplineId: '', benefitId: '' });
    };

    // --- Handlers: Provider Disciplines ---
    const handleSaveDiscipline = async () => {
        if (!newDiscipline.code || !newDiscipline.name) return;
        setLoadingCodes(true);

        const discToAdd: ProviderDiscipline = {
            id: `PD-${Date.now()}`,
            code: newDiscipline.code || '',
            name: newDiscipline.name || '',
            description: newDiscipline.description || '',
            status: 'Active'
        };

        await settingsService.saveDiscipline(discToAdd);
        // Refresh list from DB to be sure
        await loadSettings();
        
        setLoadingCodes(false);
        setIsDisciplineModalOpen(false);
        setNewDiscipline({ code: '', name: '', description: '', status: 'Active' });
    };

    // --- Renderers ---

    const renderOverview = () => (
        <div className="animate-in fade-in">
             <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
                <p className="text-gray-500">Manage master data, uploads, reports, and system parameters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Policy Renewal Engine Widget */}
                 <div 
                    onClick={() => setCurrentView('policy-renewals')}
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg cursor-pointer transform transition-all hover:-translate-y-1 hover:shadow-xl text-white group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <RotateCcw className="h-6 w-6 text-white" />
                        </div>
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            {getExpiringMembers().length} Action
                        </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">Renewal Engine</h3>
                    <p className="text-indigo-100 text-sm mb-4">Manage expiring policies and renewal rules.</p>
                    <div className="flex items-center text-xs font-medium text-white/80 group-hover:text-white">
                        Configure Rules <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                    </div>
                </div>

                <div 
                    onClick={() => setCurrentView('automation')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <CalendarDays className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Automation & Scheduler</h3>
                    <p className="text-sm text-gray-500">Manage Monthly Commission & Billing Runs.</p>
                </div>

                <div 
                    onClick={handleSeedData}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            {seeding ? <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> : <Server className="h-6 w-6 text-indigo-600" />}
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Initialize Database</h3>
                    <p className="text-sm text-gray-500">Seed Tables with Default Master Data (Policies, Disciplines).</p>
                </div>

                <div 
                    onClick={() => setCurrentView('bulk-upload')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Upload className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Bulk Data Upload</h3>
                    <p className="text-sm text-gray-500">Import members, claims, or providers via CSV/Excel.</p>
                </div>

                <div 
                    onClick={() => setCurrentView('medical-codes')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                            <Database className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Tariffs & Codes</h3>
                    <p className="text-sm text-gray-500">Manage CPT, ICD-10, and Drug master lists.</p>
                </div>

                <div 
                    onClick={() => setCurrentView('provider-disciplines')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
                            <Stethoscope className="h-6 w-6 text-teal-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Provider Disciplines</h3>
                    <p className="text-sm text-gray-500">Configure provider types and specialties.</p>
                </div>

                <div 
                    onClick={() => setCurrentView('sms')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Smartphone className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">SMS & Notifications</h3>
                    <p className="text-sm text-gray-500">View logs and configure gateway settings.</p>
                </div>

                <div 
                    onClick={() => setCurrentView('reports')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <BarChart3 className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">System Reports</h3>
                    <p className="text-sm text-gray-500">Generate financial and operational reports.</p>
                </div>

                <div 
                    onClick={() => setCurrentView('letters')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                            <Mail className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Letter Templates</h3>
                    <p className="text-sm text-gray-500">Edit automated correspondence templates.</p>
                </div>

                <div 
                    onClick={() => setCurrentView('fraud')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                            <ShieldAlert className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Fraud & Compliance</h3>
                    <p className="text-sm text-gray-500">Manage investigations and blacklists.</p>
                </div>
            </div>
        </div>
    );

    const renderAutomation = () => {
        const nextRun = automationService.getScheduledRunDate(new Date());
        
        return (
            <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
                <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
                </button>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Status Panel */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-indigo-600" /> Next Scheduled Run
                            </h3>
                            <div className="text-center py-6">
                                <div className="text-4xl font-bold text-indigo-600 mb-2">{nextRun.getDate()}</div>
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{nextRun.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                                <div className="text-xs text-gray-400 mt-2">
                                    (Rule: 10th of month, or next Monday)
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <button 
                                    onClick={() => handleTriggerAutomation('COMMISSION')}
                                    disabled={runningAutomation}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium mb-2"
                                >
                                    {runningAutomation ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Play className="h-4 w-4 mr-2" />}
                                    Force Run Commissions
                                </button>
                                <button 
                                    onClick={() => handleTriggerAutomation('PREMIUM_RECON')}
                                    disabled={runningAutomation}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                                >
                                    Force Run Reconciliation
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-900 flex items-center mb-2">
                                <AlertTriangle className="h-4 w-4 mr-2" /> Business Rule
                            </h4>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Automated calculations run on the <strong>10th</strong> of every month. If the 10th falls on a Saturday or Sunday, execution is moved to the next working day (Monday).
                            </p>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="w-full md:w-2/3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Execution History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3">Triggered By</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {automationRuns.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                No automation history found.
                                            </td>
                                        </tr>
                                    ) : automationRuns.map(run => (
                                        <tr key={run.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-500">
                                                {new Date(run.executedAt).toLocaleDateString()}
                                                <div className="text-xs text-gray-400">{new Date(run.executedAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-gray-900">{run.runType}</td>
                                            <td className="px-6 py-3 text-gray-600">{run.triggeredBy}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    run.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    run.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {run.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right text-xs text-gray-500 max-w-[150px] truncate" title={JSON.stringify(run.resultSummary)}>
                                                {run.resultSummary?.notes || JSON.stringify(run.resultSummary)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMedicalCodes = () => (
        <div className="animate-in slide-in-from-right-4">
             <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Medical Codes & Tariffs</h3>
                        <p className="text-sm text-gray-500">Manage standard codes for billing.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <select 
                            value={codeCategory}
                            onChange={(e) => setCodeCategory(e.target.value as MedicalCodeType)}
                            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                        >
                            <option value="ZRVS">ZRVS Tariff Codes</option>
                            <option value="Optometry">Optometry Tariffs</option>
                            <option value="Drug">Drugs Tariff</option>
                            <option value="Ancillary">Ancillary Tariff</option>
                            <option value="Dental">Dental Codes</option>
                            <option value="ICD10">ICD-10 Diagnostics</option>
                        </select>
                        <button 
                            onClick={() => setIsCodeModalOpen(true)}
                            className="flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Code
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder={`Search ${codeCategory} codes...`}
                            value={codeSearch}
                            onChange={(e) => setCodeSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Code</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Category</th>
                                {codeCategory !== 'ICD10' && <th className="px-6 py-3">Discipline</th>}
                                {codeCategory !== 'ICD10' && <th className="px-6 py-3 text-right">Unit Price</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {codes
                                .filter(c => c.type === codeCategory && (c.code.includes(codeSearch) || c.description.toLowerCase().includes(codeSearch.toLowerCase())))
                                .map(code => (
                                <tr key={code.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-mono font-medium text-gray-900">{code.code}</td>
                                    <td className="px-6 py-3 text-gray-600">{code.description}</td>
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {code.category || 'General'}
                                        </span>
                                    </td>
                                    {codeCategory !== 'ICD10' && (
                                        <td className="px-6 py-3 text-gray-500">
                                            {disciplines.find(d => d.id === code.disciplineId)?.name || '-'}
                                        </td>
                                    )}
                                    {codeCategory !== 'ICD10' && (
                                        <td className="px-6 py-3 text-right font-medium">
                                            {code.price ? `$${code.price.toFixed(2)}` : '-'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Code Modal */}
            {isCodeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Add New {codeCategory} Code</h3>
                        <div className="space-y-4">
                            <input 
                                placeholder="Code (e.g. 99213)" 
                                className="w-full border rounded p-2"
                                value={newCode.code}
                                onChange={e => setNewCode({...newCode, code: e.target.value})}
                            />
                            <textarea 
                                placeholder="Description" 
                                className="w-full border rounded p-2"
                                value={newCode.description}
                                onChange={e => setNewCode({...newCode, description: e.target.value})}
                            />
                            {codeCategory !== 'ICD10' && (
                                <input 
                                    type="number"
                                    placeholder="Unit Price ($)" 
                                    className="w-full border rounded p-2"
                                    value={newCode.price || ''}
                                    onChange={e => setNewCode({...newCode, price: parseFloat(e.target.value)})}
                                />
                            )}
                            
                            {/* Discipline Select */}
                            {codeCategory !== 'ICD10' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Associated Discipline</label>
                                    <select 
                                        className="w-full border rounded p-2 text-sm"
                                        value={newCode.disciplineId || ''}
                                        onChange={e => setNewCode({...newCode, disciplineId: e.target.value})}
                                    >
                                        <option value="">Select Discipline...</option>
                                        {disciplines.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Benefit Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Linked Benefit</label>
                                <select 
                                    className="w-full border rounded p-2 text-sm"
                                    value={newCode.benefitId || ''}
                                    onChange={e => setNewCode({...newCode, benefitId: e.target.value})}
                                >
                                    <option value="">Select Benefit Category...</option>
                                    {benefits.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setIsCodeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button onClick={handleSaveCode} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center">
                                    {loadingCodes && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPolicyRenewals = () => {
        const expiring = getExpiringMembers();
        
        return (
            <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
                <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Config Panel */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <SettingsIcon className="h-4 w-4 mr-2" /> Renewal Rules
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Default Duration</label>
                                <div className="flex items-center">
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-l-lg p-2 text-sm"
                                        value={renewalConfig.defaultDurationMonths}
                                        onChange={(e) => setRenewalConfig({...renewalConfig, defaultDurationMonths: parseInt(e.target.value)})}
                                    />
                                    <span className="bg-gray-100 border border-l-0 rounded-r-lg px-3 py-2 text-sm text-gray-500">Months</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notification Threshold</label>
                                <div className="flex items-center">
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-l-lg p-2 text-sm"
                                        value={renewalConfig.notificationDays}
                                        onChange={(e) => setRenewalConfig({...renewalConfig, notificationDays: parseInt(e.target.value)})}
                                    />
                                    <span className="bg-gray-100 border border-l-0 rounded-r-lg px-3 py-2 text-sm text-gray-500">Days</span>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period</label>
                                <div className="flex items-center">
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-l-lg p-2 text-sm"
                                        value={renewalConfig.gracePeriodDays}
                                        onChange={(e) => setRenewalConfig({...renewalConfig, gracePeriodDays: parseInt(e.target.value)})}
                                    />
                                    <span className="bg-gray-100 border border-l-0 rounded-r-lg px-3 py-2 text-sm text-gray-500">Days</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-medium text-gray-700">Auto-Renew</span>
                                <button 
                                    onClick={() => setRenewalConfig({...renewalConfig, autoRenew: !renewalConfig.autoRenew})}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${renewalConfig.autoRenew ? 'bg-teal-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${renewalConfig.autoRenew ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Expiring Policies</h3>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{expiring.length} Due</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Member</th>
                                        <th className="px-6 py-3">Policy End Date</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {expiring.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                <CheckCircle className="h-8 w-8 text-green-200 mx-auto mb-2" />
                                                No policies due for renewal.
                                            </td>
                                        </tr>
                                    ) : expiring.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-gray-900">
                                                {m.firstName} {m.lastName}
                                                <div className="text-xs text-gray-500">{m.id}</div>
                                            </td>
                                            <td className="px-6 py-3 text-red-600 font-medium">
                                                {m.policyEndDate}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button 
                                                    onClick={() => handleRenewMember(m)}
                                                    className="text-teal-600 hover:text-teal-800 font-medium text-xs flex items-center justify-end w-full"
                                                >
                                                    {renewingMemberId === m.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <RotateCcw className="h-3 w-3 mr-1" />}
                                                    Renew
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBulkUpload = () => (
        <div className="animate-in slide-in-from-right-4 max-w-2xl mx-auto">
             <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Bulk Data Import</h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Data Type</label>
                    <select 
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="membership">Membership List (CSV)</option>
                        <option value="claims">Historical Claims (CSV)</option>
                        <option value="providers">Provider Network (Excel)</option>
                        <option value="tariffs">Medical Tariffs (CSV)</option>
                    </select>
                </div>

                <div 
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    {uploadedFile ? (
                        <div>
                            <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                            <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                            <button 
                                onClick={() => setUploadedFile(null)} 
                                className="mt-2 text-red-500 text-xs hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm font-medium text-gray-900">Drag and drop your file here</p>
                            <p className="text-xs text-gray-500 mt-1">or</p>
                            <label className="mt-2 inline-block cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">Browse files</span>
                                <input type="file" className="hidden" onChange={handleChange} accept=".csv,.xlsx,.xls" />
                            </label>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                     <button 
                        onClick={processUpload}
                        disabled={!uploadedFile || uploadStatus === 'uploading'}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {uploadStatus === 'uploading' ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                        ) : uploadStatus === 'success' ? (
                            <><CheckCircle className="h-4 w-4 mr-2" /> Upload Complete</>
                        ) : (
                            'Start Import'
                        )}
                    </button>
                </div>
                
                {uploadStatus === 'success' && (
                     <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Success!</p>
                            <p>Data has been queued for processing. You will be notified once completed.</p>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );

    const renderSMSLogs = () => (
         <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
            <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">SMS Gateway Logs</h3>
                    <div className="flex gap-2">
                         <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Gateway: Online</span>
                         <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">Credits: 1,450</span>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Recipient</th>
                            <th className="px-6 py-3">Message</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {smsLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-gray-500">{log.timestamp}</td>
                                <td className="px-6 py-3 font-mono">{log.recipient}</td>
                                <td className="px-6 py-3 text-gray-700 max-w-md truncate" title={log.message}>{log.message}</td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        log.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                                        log.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
    );

    const renderReports = () => (
        <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
             <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6">System Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-orange-600" />
                            </div>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{report.format}</span>
                        </div>
                        <h4 className="font-bold text-gray-900">{report.name}</h4>
                        <p className="text-xs text-gray-500 mb-4">{report.category}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50">
                            <span>Last: {report.lastGenerated}</span>
                            <button className="text-teal-600 font-medium hover:text-teal-700 flex items-center">
                                <RefreshCw className="h-3 w-3 mr-1" /> Run
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLetters = () => (
        <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
             <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Automated Letter Templates</h3>
                    <button className="flex items-center px-3 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" /> New Template
                    </button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Template Name</th>
                            <th className="px-6 py-3">Target Audience</th>
                            <th className="px-6 py-3">Last Modified</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {letters.map(letter => (
                            <tr key={letter.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium text-gray-900 flex items-center">
                                    <FileUp className="h-4 w-4 mr-2 text-gray-400" />
                                    {letter.name}
                                </td>
                                <td className="px-6 py-3">{letter.recipientType}</td>
                                <td className="px-6 py-3 text-gray-500">{letter.lastModified}</td>
                                <td className="px-6 py-3">
                                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${letter.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {letter.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button className="text-teal-600 hover:text-teal-800 font-medium text-xs">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderFraud = () => (
         <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
            <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
                    <div>
                        <h3 className="font-bold text-red-900">Fraud & Waste Investigations</h3>
                        <p className="text-xs text-red-700">Confidential Case Files</p>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Case ID</th>
                            <th className="px-6 py-3">Subject</th>
                            <th className="px-6 py-3">Infraction</th>
                            <th className="px-6 py-3">Severity</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {fraudCases.map(fc => (
                            <tr key={fc.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-mono text-gray-900">{fc.id}</td>
                                <td className="px-6 py-3">
                                    <div>{fc.subjectName}</div>
                                    <div className="text-xs text-gray-500">{fc.subjectType}</div>
                                </td>
                                <td className="px-6 py-3 text-gray-700">{fc.infraction}</td>
                                <td className="px-6 py-3">
                                    <span className={`font-bold text-xs ${fc.severity === 'Critical' ? 'text-red-700' : fc.severity === 'High' ? 'text-orange-600' : 'text-gray-600'}`}>
                                        {fc.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{fc.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderProviderDisciplines = () => (
         <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto">
            <button onClick={() => setCurrentView('overview')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
            </button>
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Provider Disciplines</h3>
                <button 
                    onClick={() => setIsDisciplineModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Discipline
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {disciplines.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No disciplines found. 
                                    <button onClick={handleSeedData} className="ml-2 text-teal-600 hover:underline font-medium">
                                        Initialize Defaults?
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            disciplines.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-mono text-gray-900">{d.code}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{d.name}</td>
                                    <td className="px-6 py-3 text-gray-600">{d.description}</td>
                                    <td className="px-6 py-3">
                                        <span className="text-green-600 text-xs font-bold uppercase">{d.status}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                 </table>
            </div>

            {isDisciplineModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Add Discipline</h3>
                        <div className="space-y-4">
                            <input 
                                placeholder="Code (e.g. 010)" 
                                className="w-full border rounded p-2"
                                value={newDiscipline.code}
                                onChange={e => setNewDiscipline({...newDiscipline, code: e.target.value})}
                            />
                            <input 
                                placeholder="Name (e.g. General Practitioner)" 
                                className="w-full border rounded p-2"
                                value={newDiscipline.name}
                                onChange={e => setNewDiscipline({...newDiscipline, name: e.target.value})}
                            />
                            <textarea 
                                placeholder="Description" 
                                className="w-full border rounded p-2"
                                value={newDiscipline.description}
                                onChange={e => setNewDiscipline({...newDiscipline, description: e.target.value})}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setIsDisciplineModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button onClick={handleSaveDiscipline} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center">
                                    {loadingCodes && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {currentView === 'overview' && renderOverview()}
            {currentView === 'policy-renewals' && renderPolicyRenewals()}
            {currentView === 'automation' && renderAutomation()}
            {currentView === 'bulk-upload' && renderBulkUpload()}
            {currentView === 'medical-codes' && renderMedicalCodes()}
            {currentView === 'sms' && renderSMSLogs()}
            {currentView === 'reports' && renderReports()}
            {currentView === 'letters' && renderLetters()}
            {currentView === 'fraud' && renderFraud()}
            {currentView === 'provider-disciplines' && renderProviderDisciplines()}
        </div>
    );
};

export default Settings;
