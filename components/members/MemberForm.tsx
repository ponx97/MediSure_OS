
import React, { useState, useEffect, useRef } from 'react';
import { Member, Policy, Dependant, User, Claim, AuditLog, MedicalCondition, Allergy, Medication, Benefit, Agent, PremiumPayer } from '../../types';
import { MOCK_CLAIMS } from '../../services/mockData';
import { memberService } from '../../services/memberService';
import { policyService } from '../../services/policyService';
import { agentService } from '../../services/agentService';
import { payerService } from '../../services/payerService';
import { 
  User as UserIcon, 
  CreditCard, 
  Users, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  ArrowUp,
  ArrowDown,
  Camera,
  Upload,
  Download,
  Ban,
  Edit,
  Power,
  Lock,
  History,
  X,
  Activity,
  Search,
  Briefcase
} from 'lucide-react';

interface MemberFormProps {
  initialMember?: Member;
  onSave: (member: Member) => Promise<void> | void;
  onCancel: () => void;
  currentUser: User;
}

const emptyMember: Member = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  dob: '',
  maritalStatus: 'Single',
  address: '',
  phoneNumber: '',
  gender: 'Male',
  bankingDetails: { bankName: '', branchCode: '', accountNumber: '' },
  premiumPayer: '',
  policyId: '',
  joinDate: new Date().toISOString().split('T')[0],
  policyEndDate: '',
  agentIds: [],
  dependants: [],
  medicalHistory: { conditions: [], allergies: [], medications: [] },
  status: 'Pending',
  balance: 0,
  photoUrl: '',
  applicationFormUrl: ''
};

const MemberForm: React.FC<MemberFormProps> = ({ initialMember, onSave, onCancel, currentUser }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Member>(initialMember || emptyMember);
  
  // Data States
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [payers, setPayers] = useState<PremiumPayer[]>([]);

  // Dependant Form State
  const [dependantForm, setDependantForm] = useState<Partial<Dependant>>({});
  const [isAddingDependant, setIsAddingDependant] = useState(false);
  const [editingDependantId, setEditingDependantId] = useState<string | null>(null);

  // Medical History Form State
  const [conditionForm, setConditionForm] = useState<Partial<MedicalCondition>>({ severity: 'Mild' });
  const [allergyForm, setAllergyForm] = useState<Partial<Allergy>>({ severity: 'Mild' });
  const [medicationForm, setMedicationForm] = useState<Partial<Medication>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for file inputs
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const fetchData = async () => {
          const [pols, bens, agts, payersList] = await Promise.all([
              policyService.getPolicies(),
              policyService.getBenefits(),
              agentService.getAll(),
              payerService.getAll()
          ]);
          setPolicies(pols);
          setBenefits(bens);
          setAgents(agts);
          setPayers(payersList);
      };
      fetchData();
  }, []);

  const tabs = [
    { label: 'Personal Information', icon: UserIcon },
    { label: 'Product & Agent', icon: ShieldCheck },
    { label: 'Dependants', icon: Users },
    { label: 'Medical History', icon: Activity },
    { label: 'Benefits', icon: CreditCard },
    { label: 'Claims', icon: FileText },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'document' | 'dependant') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const memberId = formData.id || `temp-${Date.now()}`;
      const ext = file.name.split('.').pop();
      let path = '';
      
      if (type === 'profile') {
        path = `${memberId}/profile-${Date.now()}.${ext}`;
      } else if (type === 'document') {
        path = `${memberId}/application-form-${Date.now()}.${ext}`;
      } else if (type === 'dependant') {
        path = `${memberId}/dependants/${Date.now()}.${ext}`;
      }

      const url = await memberService.uploadFile(file, path);
      
      if (url) {
        if (type === 'profile') {
          setFormData(prev => ({ ...prev, photoUrl: url }));
        } else if (type === 'document') {
           setFormData(prev => ({ ...prev, applicationFormUrl: url }));
        } else if (type === 'dependant') {
           setDependantForm(prev => ({ ...prev, photoUrl: url }));
        }
      }
    } catch (err) {
      console.error('File upload failed', err);
      alert('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const calculateChanges = (oldM: Member, newM: Member) => {
    const changes: Record<string, { old: any, new: any }> = {};
    const fieldsToTrack: (keyof Member)[] = ['firstName', 'lastName', 'status', 'policyId', 'email', 'phoneNumber', 'address', 'dob', 'policyEndDate'];
    
    fieldsToTrack.forEach(field => {
        if (oldM[field] !== newM[field]) {
            changes[field] = { old: oldM[field], new: newM[field] };
        }
    });
    return changes;
  };

  const handleSaveWrapper = async (updatedData: Member) => {
      setIsSaving(true);
      const isNew = !initialMember || !initialMember.id;
      const finalId = updatedData.id || `MEM-TEMP-${Date.now()}`;
      const payload = { ...updatedData, id: finalId };
      
      try {
        await onSave(payload);

        let auditAction: 'Create' | 'Update' = isNew ? 'Create' : 'Update';
        let changes: Record<string, any> = {};

        if (isNew) {
            changes = { "all": { old: null, new: "Record Created" } };
        } else if (initialMember) {
            changes = calculateChanges(initialMember, payload);
        }

        if (isNew || Object.keys(changes).length > 0) {
            await memberService.saveAuditLog({
                recordId: finalId,
                entity: 'Member',
                action: auditAction,
                changes: changes,
                performedBy: currentUser.name,
                timestamp: new Date().toISOString()
            });
        }
      } catch (e) {
        console.error("Save failed", e);
      } finally {
        setIsSaving(false);
      }
  };

  // --- Sub-Components ---
  
  const handleSaveDependant = () => {
    if (!dependantForm.firstName || !dependantForm.lastName) return;
    
    if (editingDependantId) {
      setFormData(prev => ({
        ...prev,
        dependants: prev.dependants.map(d => d.id === editingDependantId ? { ...d, ...dependantForm } as Dependant : d)
      }));
    } else {
      const newDependant: Dependant = {
        id: `DEP-${Date.now()}`,
        firstName: dependantForm.firstName || '',
        middleName: dependantForm.middleName,
        lastName: dependantForm.lastName || '',
        dob: dependantForm.dob || '',
        idNumber: dependantForm.idNumber || '',
        relationship: dependantForm.relationship || 'Child',
        joinDate: dependantForm.joinDate || new Date().toISOString().split('T')[0],
        gender: (dependantForm.gender as any) || 'Male',
        photoUrl: dependantForm.photoUrl,
        status: 'Active'
      };
      setFormData(prev => ({ ...prev, dependants: [...prev.dependants, newDependant] }));
    }
    setDependantForm({});
    setIsAddingDependant(false);
    setEditingDependantId(null);
  };

  const addMedicalCondition = () => {
    if (!conditionForm.name || !conditionForm.diagnosedDate) return;
    const newItem: MedicalCondition = {
      id: `COND-${Date.now()}`,
      name: conditionForm.name,
      diagnosedDate: conditionForm.diagnosedDate,
      severity: (conditionForm.severity as any) || 'Mild'
    };
    setFormData(prev => ({ ...prev, medicalHistory: { ...prev.medicalHistory!, conditions: [...(prev.medicalHistory?.conditions || []), newItem] } }));
    setConditionForm({ severity: 'Mild', name: '', diagnosedDate: '' });
  };

  const addAllergy = () => {
    if (!allergyForm.allergen || !allergyForm.reaction) return;
    const newItem: Allergy = {
      id: `ALG-${Date.now()}`,
      allergen: allergyForm.allergen,
      reaction: allergyForm.reaction,
      severity: (allergyForm.severity as any) || 'Mild'
    };
    setFormData(prev => ({ ...prev, medicalHistory: { ...prev.medicalHistory!, allergies: [...(prev.medicalHistory?.allergies || []), newItem] } }));
    setAllergyForm({ severity: 'Mild', allergen: '', reaction: '' });
  };

  const addMedication = () => {
    if (!medicationForm.name || !medicationForm.dosage) return;
    const newItem: Medication = {
      id: `MED-${Date.now()}`,
      name: medicationForm.name,
      dosage: medicationForm.dosage,
      frequency: medicationForm.frequency || ''
    };
    setFormData(prev => ({ ...prev, medicalHistory: { ...prev.medicalHistory!, medications: [...(prev.medicalHistory?.medications || []), newItem] } }));
    setMedicationForm({ name: '', dosage: '', frequency: '' });
  };

  const renderPersonalTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <div className="relative group">
                <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center ${isUploading ? 'opacity-50' : ''}`}>
                    {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                    <UserIcon className="h-12 w-12 text-gray-300" />
                    )}
                </div>
                <button 
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-teal-600 p-2 rounded-full text-white shadow-md hover:bg-teal-700 transition-colors"
                    type="button"
                >
                    <Camera className="h-4 w-4" />
                </button>
                <input 
                    type="file" 
                    ref={profileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'profile')}
                />
                {isUploading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 text-teal-600 animate-spin"/></div>}
            </div>
            
            <div className="flex-1 space-y-2 text-center md:text-left">
                <h3 className="text-lg font-medium text-gray-900">Member Identity</h3>
                <p className="text-sm text-gray-500">Upload a clear passport-style photo for the member card.</p>
                {formData.id && <p className="text-xs text-gray-400 font-mono">ID: {formData.id}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID / SSN</label>
                <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address</label>
                <textarea rows={3} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
             <h4 className="text-sm font-bold text-gray-800 mb-4">Banking Details</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.bankingDetails.bankName} onChange={e => setFormData({...formData, bankingDetails: {...formData.bankingDetails, bankName: e.target.value}})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.bankingDetails.branchCode} onChange={e => setFormData({...formData, bankingDetails: {...formData.bankingDetails, branchCode: e.target.value}})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.bankingDetails.accountNumber} onChange={e => setFormData({...formData, bankingDetails: {...formData.bankingDetails, accountNumber: e.target.value}})} />
                </div>
             </div>
        </div>
    </div>
  );

  const renderProductTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Plan</label>
                <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.policyId} onChange={e => setFormData({...formData, policyId: e.target.value})}>
                    <option value="">Select a Policy</option>
                    {policies.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Status</label>
                <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Terminated">Terminated</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input type="date" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy End Date</label>
                <input type="date" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" value={formData.policyEndDate || ''} onChange={e => setFormData({...formData, policyEndDate: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Leave blank for open-ended policies.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premium Payer</label>
                <select 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" 
                    value={formData.premiumPayerId || ''} 
                    onChange={e => {
                        const selectedPayer = payers.find(p => p.id === e.target.value);
                        setFormData({
                            ...formData, 
                            premiumPayerId: e.target.value,
                            premiumPayer: selectedPayer?.name || ''
                        });
                    }}
                >
                    <option value="">Select Payer</option>
                    {payers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            
            {/* AGENT SELECTION */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Agent / Broker</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select 
                        className="w-full pl-10 border rounded-lg p-2 focus:ring-2 focus:ring-teal-500" 
                        value={formData.agentIds?.[0] || ''} 
                        onChange={e => setFormData({...formData, agentIds: e.target.value ? [e.target.value] : []})}
                    >
                        <option value="">No Agent Assigned</option>
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                        ))}
                    </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Select the primary agent for commission tracking.</p>
            </div>
        </div>
        
        <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-800 mb-4">Application Documents</h4>
             <div className="flex items-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                <FileText className="h-8 w-8 text-gray-400 mr-4" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{formData.applicationFormUrl ? 'Application Form Uploaded' : 'No Application Form'}</p>
                    <p className="text-xs text-gray-500">PDF or Image of signed application form.</p>
                </div>
                {formData.applicationFormUrl && (
                     <a href={formData.applicationFormUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:text-blue-800">
                        <Download className="h-5 w-5" />
                     </a>
                )}
                <label className="cursor-pointer ml-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    Upload
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'document')} />
                </label>
             </div>
        </div>
    </div>
  );

  const renderDependantsTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-800">Registered Dependants</h4>
            {!isAddingDependant && (
                <button onClick={() => { setIsAddingDependant(true); setDependantForm({}); setEditingDependantId(null); }} className="flex items-center text-sm bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-1" /> Add Dependant
                </button>
            )}
        </div>

        {isAddingDependant && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                <h5 className="font-medium text-gray-900 mb-4">{editingDependantId ? 'Edit Dependant' : 'New Dependant'}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input placeholder="First Name" className="border rounded p-2" value={dependantForm.firstName || ''} onChange={e => setDependantForm({...dependantForm, firstName: e.target.value})} />
                    <input placeholder="Last Name" className="border rounded p-2" value={dependantForm.lastName || ''} onChange={e => setDependantForm({...dependantForm, lastName: e.target.value})} />
                    <input placeholder="ID Number" className="border rounded p-2" value={dependantForm.idNumber || ''} onChange={e => setDependantForm({...dependantForm, idNumber: e.target.value})} />
                    <input type="date" className="border rounded p-2" value={dependantForm.dob || ''} onChange={e => setDependantForm({...dependantForm, dob: e.target.value})} />
                    <select className="border rounded p-2" value={dependantForm.relationship || 'Child'} onChange={e => setDependantForm({...dependantForm, relationship: e.target.value})}>
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                    </select>
                    <select className="border rounded p-2" value={dependantForm.gender || 'Male'} onChange={e => setDependantForm({...dependantForm, gender: e.target.value as any})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingDependant(false)} className="px-4 py-2 border rounded-lg bg-white">Cancel</button>
                    <button onClick={handleSaveDependant} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save Dependant</button>
                </div>
            </div>
        )}

        {formData.dependants.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                No dependants registered.
            </div>
        ) : (
            <div className="space-y-3">
                {formData.dependants.map(dep => (
                    <div key={dep.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm">
                        <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 font-bold text-gray-500">
                                {dep.firstName[0]}{dep.lastName[0]}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{dep.firstName} {dep.lastName}</p>
                                <p className="text-xs text-gray-500">{dep.relationship} • {dep.dob}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`text-xs px-2 py-1 rounded-full ${dep.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {dep.status}
                             </span>
                             <button onClick={() => { setDependantForm(dep); setEditingDependantId(dep.id); setIsAddingDependant(true); }} className="p-1 text-gray-400 hover:text-blue-600">
                                <Edit className="h-4 w-4" />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderMedicalHistoryTab = () => (
    <div className="space-y-8 animate-in fade-in">
        {/* Conditions */}
        <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Chronic Conditions</h4>
            <div className="flex gap-2 mb-4">
                <input placeholder="Condition Name" className="flex-1 border rounded p-2 text-sm" value={conditionForm.name || ''} onChange={e => setConditionForm({...conditionForm, name: e.target.value})} />
                <input type="date" className="border rounded p-2 text-sm" value={conditionForm.diagnosedDate || ''} onChange={e => setConditionForm({...conditionForm, diagnosedDate: e.target.value})} />
                <button onClick={addMedicalCondition} className="px-3 py-2 bg-blue-600 text-white rounded text-sm"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
                {formData.medicalHistory?.conditions.map(c => (
                    <span key={c.id} className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm border border-red-100">
                        {c.name} ({c.diagnosedDate})
                        <button onClick={() => setFormData(prev => ({...prev, medicalHistory: {...prev.medicalHistory!, conditions: prev.medicalHistory?.conditions.filter(x => x.id !== c.id) || []}}))} className="ml-2 hover:text-red-900"><X className="h-3 w-3" /></button>
                    </span>
                ))}
                {(!formData.medicalHistory?.conditions || formData.medicalHistory.conditions.length === 0) && <span className="text-sm text-gray-400 italic">No conditions recorded</span>}
            </div>
        </div>

        {/* Allergies */}
        <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Allergies</h4>
             <div className="flex gap-2 mb-4">
                <input placeholder="Allergen" className="flex-1 border rounded p-2 text-sm" value={allergyForm.allergen || ''} onChange={e => setAllergyForm({...allergyForm, allergen: e.target.value})} />
                <input placeholder="Reaction" className="flex-1 border rounded p-2 text-sm" value={allergyForm.reaction || ''} onChange={e => setAllergyForm({...allergyForm, reaction: e.target.value})} />
                <button onClick={addAllergy} className="px-3 py-2 bg-blue-600 text-white rounded text-sm"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
                {formData.medicalHistory?.allergies.map(a => (
                    <span key={a.id} className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm border border-orange-100">
                        {a.allergen} - {a.reaction}
                         <button onClick={() => setFormData(prev => ({...prev, medicalHistory: {...prev.medicalHistory!, allergies: prev.medicalHistory?.allergies.filter(x => x.id !== a.id) || []}}))} className="ml-2 hover:text-orange-900"><X className="h-3 w-3" /></button>
                    </span>
                ))}
            </div>
        </div>

        {/* Medication */}
        <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Current Medication</h4>
             <div className="flex gap-2 mb-4">
                <input placeholder="Medication Name" className="flex-1 border rounded p-2 text-sm" value={medicationForm.name || ''} onChange={e => setMedicationForm({...medicationForm, name: e.target.value})} />
                <input placeholder="Dosage" className="w-24 border rounded p-2 text-sm" value={medicationForm.dosage || ''} onChange={e => setMedicationForm({...medicationForm, dosage: e.target.value})} />
                <button onClick={addMedication} className="px-3 py-2 bg-blue-600 text-white rounded text-sm"><Plus className="h-4 w-4" /></button>
            </div>
            <ul className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                {formData.medicalHistory?.medications.map(m => (
                    <li key={m.id} className="p-3 bg-gray-50 flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-900">{m.name} <span className="text-gray-500 font-normal">({m.dosage})</span></span>
                         <button onClick={() => setFormData(prev => ({...prev, medicalHistory: {...prev.medicalHistory!, medications: prev.medicalHistory?.medications.filter(x => x.id !== m.id) || []}}))} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );

  const renderBenefitsTab = () => {
    const policy = policies.find(p => p.id === formData.policyId);
    if (!policy) return <div className="text-center py-10 text-gray-500">Please select a policy in the Product tab to view benefits.</div>;
    
    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg">
                <h3 className="font-bold text-teal-900">{policy.name}</h3>
                <p className="text-sm text-teal-700">Annual Limit: {policy.currency} {policy.coverageLimit.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {policy.benefits.map((pb, idx) => {
                     const bDetail = benefits.find(b => b.id === pb.benefitId);
                     return (
                         <div key={idx} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-white">
                            <div>
                                <p className="font-medium text-gray-900">{bDetail?.name || pb.benefitId}</p>
                                <p className="text-xs text-gray-500">{bDetail?.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">
                                    {bDetail?.limitType === 'Amount' ? '$' : ''}{pb.limit}{bDetail?.limitType === 'Percentage' ? '%' : ''}
                                </p>
                                <p className="text-xs text-gray-400">Limit</p>
                            </div>
                         </div>
                     );
                })}
            </div>
        </div>
    );
  };

  const renderClaimsTab = () => {
      const claims = MOCK_CLAIMS.filter(c => c.memberId === formData.id);
      return (
          <div className="space-y-4 animate-in fade-in">
              {claims.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No claims history found for this member.</div>
              ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                              <tr>
                                  <th className="px-4 py-2">Date</th>
                                  <th className="px-4 py-2">Provider</th>
                                  <th className="px-4 py-2">Diagnosis</th>
                                  <th className="px-4 py-2">Amount</th>
                                  <th className="px-4 py-2">Status</th>
                              </tr>
                          </thead>
                          <tbody>
                              {claims.map(c => (
                                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                                      <td className="px-4 py-2">{c.serviceDate}</td>
                                      <td className="px-4 py-2">{c.providerName}</td>
                                      <td className="px-4 py-2">{c.diagnosisCode}</td>
                                      <td className="px-4 py-2 font-medium">${c.amountBilled}</td>
                                      <td className="px-4 py-2">
                                          <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{c.status}</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
         <div className="flex items-center">
             <button onClick={onCancel} className="mr-4 text-gray-500 hover:text-gray-800">
                 <ArrowLeft className="h-5 w-5" />
             </button>
             <div>
                 <h2 className="text-lg font-bold text-gray-900">{formData.id ? `Edit Member: ${formData.firstName} ${formData.lastName}` : 'New Membership Application'}</h2>
                 <p className="text-xs text-gray-500">{formData.id || 'Draft'}</p>
             </div>
         </div>
         <div className="flex gap-3">
             <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
             <button onClick={() => handleSaveWrapper(formData)} disabled={isSaving} className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium shadow-sm disabled:opacity-50">
                 {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                 Save Changes
             </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
            <div className="p-4 space-y-1">
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === idx ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon className={`h-5 w-5 mr-3 ${activeTab === idx ? 'text-teal-600' : 'text-gray-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>
            {formData.id && (
                <div className="mt-auto p-4 border-t border-gray-100">
                   <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Member Audit</div>
                   <div className="text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
                </div>
            )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
            <div className="max-w-4xl mx-auto">
                {activeTab === 0 && renderPersonalTab()}
                {activeTab === 1 && renderProductTab()}
                {activeTab === 2 && renderDependantsTab()}
                {activeTab === 3 && renderMedicalHistoryTab()}
                {activeTab === 4 && renderBenefitsTab()}
                {activeTab === 5 && renderClaimsTab()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default MemberForm;
