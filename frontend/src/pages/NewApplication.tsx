import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, FileText, Users, Shield, Upload, CheckCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createApplication, getApplicationDetails, modifyApplication } from '@/lib/api';
import { z } from 'zod';

const applicantSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(1, "Phone number is required").max(20),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
});

const researchSchema = z.object({
  projectTitle: z.string().trim().min(1, "Project title is required").max(200),
  projectDescription: z.string().trim().min(50, "Description must be at least 50 characters").max(2000),
  researchType: z.string().min(1, "Research type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  fundingSource: z.string().trim().min(1, "Funding source is required").max(200),
}).refine((data) => {
  // Validate start date is not in the past
  if (data.startDate) {
    const selectedDate = new Date(data.startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return false;
    }
  }
  return true;
}, {
  message: "Start date cannot be in the past",
  path: ["startDate"],
}).refine((data) => {
  // Validate end date is after start date
  if (data.startDate && data.endDate) {
    const end = new Date(data.endDate + 'T00:00:00');
    const start = new Date(data.startDate + 'T00:00:00');

    // Calculate minimum end date (start date + 3 weeks)
    const minEndDate = new Date(start);
    minEndDate.setDate(minEndDate.getDate() + 21);

    if (end < minEndDate) {
      return false;
    }
  }
  return true;
}, {
  message: "End date must be at least 3 weeks after start date",
  path: ["endDate"],
});

const participantsSchema = z.object({
  participantCount: z.string().min(1, "Number of participants is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  recruitmentMethod: z.string().trim().min(20, "Please describe recruitment method in detail").max(1000),
  vulnerablePopulations: z.string().max(1000).optional(),
});

const ethicsSchema = z.object({
  informedConsent: z.boolean().refine(val => val === true, "You must confirm informed consent"),
  dataConfidentiality: z.boolean().refine(val => val === true, "You must confirm data confidentiality"),
  riskAssessment: z.string().trim().min(20, "Please describe risk assessment in detail").max(1000),
  expectedBenefits: z.string().trim().min(20, "Please describe expected benefits in detail").max(1000),
});

const submitSchema = z.object({
  accuracyDeclaration: z.boolean().refine(val => val === true, "You must confirm the accuracy declaration"),
  complianceAgreement: z.boolean().refine(val => val === true, "You must agree to compliance"),
});

const NewApplicationContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const { setOpen } = useSidebar();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applicant');
  const [documentFiles, setDocumentFiles] = useState<{
    informedConsent: File | null;
    researchProtocol: File | null;
    dataCollection: File | null;
    institutionalApprovals: File | null;
    otherDocuments: File | null;
  }>({
    informedConsent: null,
    researchProtocol: null,
    dataCollection: null,
    institutionalApprovals: null,
    otherDocuments: null,
  });
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const fileInputRefs = {
    informedConsent: React.useRef<HTMLInputElement>(null),
    researchProtocol: React.useRef<HTMLInputElement>(null),
    dataCollection: React.useRef<HTMLInputElement>(null),
    institutionalApprovals: React.useRef<HTMLInputElement>(null),
    otherDocuments: React.useRef<HTMLInputElement>(null),
  };

  // Form data states
  const [applicantData, setApplicantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
  });

  const [researchData, setResearchData] = useState({
    projectTitle: '',
    projectDescription: '',
    researchType: '',
    startDate: '',
    endDate: '',
    fundingSource: '',
  });

  const [participantsData, setParticipantsData] = useState({
    participantCount: '',
    ageGroup: '',
    recruitmentMethod: '',
    vulnerablePopulations: '',
  });

  const [ethicsData, setEthicsData] = useState({
    informedConsent: false,
    dataConfidentiality: false,
    riskAssessment: '',
    expectedBenefits: '',
  });

  const [submitData, setSubmitData] = useState({
    accuracyDeclaration: false,
    complianceAgreement: false,
  });

  const [unlockedTabs, setUnlockedTabs] = useState<string[]>(['applicant']);
  const [dateErrors, setDateErrors] = useState({
    startDate: '',
    endDate: '',
  });
  const [skipDocuments, setSkipDocuments] = useState(false);

  // Auto-fill user information from localStorage
  // Auto-fill user information from localStorage
  useEffect(() => {
    setOpen(false);

    // Load user profile and auto-fill form
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      try {
        const parsed = JSON.parse(userProfile);
        setApplicantData(prev => ({
          ...prev,
          firstName: parsed.firstName || parsed.name || '',
          lastName: parsed.surname || '',
          email: parsed.email || '',
          department: parsed.faculty || '', // Use faculty name for department
        }));
      } catch (err) {
        console.error('Error parsing user profile:', err);
      }
    }

    if (editId) {
      const fetchApp = async () => {
        try {
          const res = await getApplicationDetails(editId);
          const app = res.data;

          setApplicantData(prev => ({
            ...prev,
            email: app.email || prev.email,
          }));

          setResearchData({
            projectTitle: app.title || '',
            projectDescription: app.description || '',
            researchType: app.research_type || '',
            startDate: app.start_date || '',
            endDate: app.end_date || '',
            fundingSource: app.funding_source || '',
          });

          setParticipantsData({
            participantCount: app.participant_count || '',
            vulnerablePopulations: app.vulnerable_populations || '',
            ageGroup: '',
            recruitmentMethod: '',
          });

          setEthicsData({
            riskAssessment: app.risk_level || '',
            expectedBenefits: '',
            informedConsent: true,
            dataConfidentiality: app.data_protection === 'true' || app.data_protection === true,
          });

          setExistingDocuments(app.documents || []);
        } catch (e) {
          toast({ title: "Error", description: "Failed to load application for editing", variant: "destructive" });
        }
      }
      fetchApp();
    }
  }, [setOpen, editId]);

  // Get today's date in YYYY-MM-DD format for date inputs
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum end date (start date or today, whichever is later)
  const getMinEndDate = () => {
    if (researchData.startDate) {
      return researchData.startDate;
    }
    return getTodayDate();
  };

  const handleFileChange = (field: keyof typeof documentFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const handleDragOver = (field: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingField(field);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingField(null);
  };

  const handleDrop = (field: keyof typeof documentFiles) => (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingField(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDocumentFiles(prev => ({ ...prev, [field]: e.dataTransfer.files[0] }));
    }
  };

  const handleUploadClick = (field: keyof typeof fileInputRefs) => () => {
    fileInputRefs[field].current?.click();
  };

  const removeFile = (field: keyof typeof documentFiles) => () => {
    setDocumentFiles(prev => ({ ...prev, [field]: null }));
  };

  const validateAndProceed = (currentTab: string, nextTab: string, schema: z.ZodSchema, data: any) => {
    try {
      schema.parse(data);
      setActiveTab(nextTab);
      if (!unlockedTabs.includes(nextTab)) {
        setUnlockedTabs([...unlockedTabs, nextTab]);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleApplicantNext = () => {
    validateAndProceed('applicant', 'research', applicantSchema, applicantData);
  };

  const validateDates = () => {
    const errors = { startDate: '', endDate: '' };
    let hasErrors = false;

    // Validate start date
    if (!researchData.startDate) {
      errors.startDate = 'Start date is required';
      hasErrors = true;
    } else {
      const startDate = new Date(researchData.startDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        errors.startDate = 'Start date cannot be in the past';
        hasErrors = true;
      }
    }

    // Validate end date
    if (!researchData.endDate) {
      errors.endDate = 'End date is required';
      hasErrors = true;
    } else if (researchData.startDate) {
      const endDate = new Date(researchData.endDate + 'T00:00:00');
      const startDate = new Date(researchData.startDate + 'T00:00:00');

      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 21);

      if (endDate < minEndDate) {
        errors.endDate = 'End date must be at least 3 weeks after start date';
        hasErrors = true;
      }
    }

    setDateErrors(errors);
    return !hasErrors;
  };

  const handleResearchNext = () => {
    // First validate dates
    const datesValid = validateDates();

    if (!datesValid) {
      toast({
        title: "Date Validation Error",
        description: "Please fix the date errors before proceeding",
        variant: "destructive",
      });
      return;
    }

    // Then validate with schema (but skip date validation in schema since we already did it)
    try {
      // Create a schema without date validation for the basic check
      const basicSchema = z.object({
        projectTitle: z.string().trim().min(1, "Project title is required").max(200),
        projectDescription: z.string().trim().min(50, "Description must be at least 50 characters").max(2000),
        researchType: z.string().min(1, "Research type is required"),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().min(1, "End date is required"),
        fundingSource: z.string().trim().min(1, "Funding source is required").max(200),
      });

      basicSchema.parse(researchData);

      // If validation passes, proceed
      setActiveTab('participants');
      if (!unlockedTabs.includes('participants')) {
        setUnlockedTabs([...unlockedTabs, 'participants']);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleParticipantsNext = () => {
    validateAndProceed('participants', 'ethics', participantsSchema, participantsData);
  };

  const handleEthicsNext = () => {
    validateAndProceed('ethics', 'documents', ethicsSchema, ethicsData);
  };

  const handleDocumentsNext = () => {
    // If skipping documents, bypass validation
    if (skipDocuments) {
      setActiveTab('submit');
      if (!unlockedTabs.includes('submit')) {
        setUnlockedTabs([...unlockedTabs, 'submit']);
      }
      return;
    }

    // Count uploaded documents
    const uploadedDocs = Object.values(documentFiles).filter(file => file !== null);
    const existingCount = existingDocuments.length;

    // Backend Logic: If any new files are uploaded, ALL old files are deleted.
    // So we must ensuring EITHER (uploaded > 0 AND uploaded >= 5) OR (uploaded == 0 AND existing >= 5)

    let isValid = false;
    let message = "";

    if (uploadedDocs.length > 0) {
      // User is replacing documents
      if (uploadedDocs.length < 5) {
        isValid = false;
        message = `If you are updating documents, you must upload all 5 required files. You have uploaded ${uploadedDocs.length}.`;
      } else {
        isValid = true;
      }
    } else {
      // User is keeping existing documents
      if (existingCount < 5) {
        isValid = false;
        message = `You must have at least 5 documents. You have ${existingCount} existing documents.`;
      } else {
        isValid = true;
      }
    }

    if (!isValid) {
      const docNames: Record<string, string> = {
        informedConsent: 'Informed Consent Form',
        researchProtocol: 'Research Protocol or Proposal',
        dataCollection: 'Data Collection Instruments',
        institutionalApprovals: 'Institutional Approvals',
        otherDocuments: 'Other Documents',
      };

      const missingDocs = Object.entries(documentFiles)
        .filter(([_, file]) => !file)
        .map(([key, _]) => docNames[key as keyof typeof docNames]);

      toast({
        title: "Document Upload Required",
        description: `You must upload at least 5 documents. Missing: ${missingDocs.join(', ')} (${uploadedDocs.length}/5 uploaded). Or check 'Skip document upload'.`,
        variant: "destructive",
      });
      return;
    }

    setActiveTab('submit');
    if (!unlockedTabs.includes('submit')) {
      setUnlockedTabs([...unlockedTabs, 'submit']);
    }
  };

  /* API submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      submitSchema.parse(submitData);

      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      if (!userProfile.id) {
        toast({ title: 'Error', description: 'User ID not found. Please login again.', variant: 'destructive' });
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userProfile.id);
      formData.append('faculty_id', userProfile.faculty_id ? String(userProfile.faculty_id) : '1'); // Fallback or handle appropriately
      formData.append('committee_id', '1'); // Default or selectable
      formData.append('title', researchData.projectTitle);
      formData.append('description', researchData.projectDescription);

      // Append missing fields
      formData.append('research_type', researchData.researchType);
      formData.append('start_date', researchData.startDate);
      formData.append('end_date', researchData.endDate);
      formData.append('funding_source', researchData.fundingSource);
      formData.append('participant_count', participantsData.participantCount);
      formData.append('vulnerable_populations', participantsData.vulnerablePopulations);
      formData.append('risk_level', ethicsData.riskAssessment);
      formData.append('data_protection', String(ethicsData.dataConfidentiality));
      formData.append('skip_documents', String(skipDocuments));

      const filesToUpload = [
        documentFiles.informedConsent,
        documentFiles.researchProtocol,
        documentFiles.dataCollection,
        documentFiles.institutionalApprovals,
        documentFiles.otherDocuments
      ].filter(Boolean);

      filesToUpload.forEach(file => {
        if (file) formData.append('documents', file);
      });

      let response;
      if (editId) {
        response = await modifyApplication(editId, formData);
      } else {
        response = await createApplication(formData);
      }

      const newApp = response.data.application || response.data;

      setReferenceNumber(String(newApp.application_id)); // Use real ID

      // Optionally keep localStorage for offline fallback or simple history? 
      // For now, let's rely on backend source of truth.
      setIsSubmitted(true);

      toast({
        title: "Success",
        description: "Application submitted successfully!",
      });

    } catch (error: any) {
      console.error(error);
      const msg = error instanceof z.ZodError ? error.errors[0].message : (error.message || "Submission failed");
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSubmitAnother = () => {
    setIsSubmitted(false);
    setActiveTab('applicant');
    setDocumentFiles({
      informedConsent: null,
      researchProtocol: null,
      dataCollection: null,
      institutionalApprovals: null,
      otherDocuments: null,
    });
    setReferenceNumber('');
    setApplicantData({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '' });
    setResearchData({ projectTitle: '', projectDescription: '', researchType: '', startDate: '', endDate: '', fundingSource: '' });
    setParticipantsData({ participantCount: '', ageGroup: '', recruitmentMethod: '', vulnerablePopulations: '' });
    setEthicsData({ informedConsent: false, dataConfidentiality: false, riskAssessment: '', expectedBenefits: '' });
    setSubmitData({ accuracyDeclaration: false, complianceAgreement: false });
    setUnlockedTabs(['applicant']);
  };

  if (isSubmitted) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-4 py-4">
          <div className="flex items-center gap-4 max-w-7xl mx-auto">
            <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
            <Button
              variant="ghost"
              onClick={handleReturnToDashboard}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-8 md:p-12 border border-emerald-200 dark:border-emerald-900">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Application Submitted Successfully
                </h1>
                <p className="text-emerald-700 dark:text-emerald-400 text-lg">
                  Your ethics committee application has been received. You will be notified via email once the review process begins.
                </p>
              </div>

              <div className="py-4">
                <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                  Reference Number: <span className="font-semibold">{referenceNumber}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  onClick={handleReturnToDashboard}
                  variant="outline"
                  className="border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                >
                  Return to Dashboard
                </Button>
                <Button
                  onClick={handleSubmitAnother}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  Submit Another Application
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { value: 'applicant', label: 'Applicant', icon: User },
    { value: 'research', label: 'Research', icon: FileText },
    { value: 'participants', label: 'Participants', icon: Users },
    { value: 'ethics', label: 'Ethics', icon: Shield },
    { value: 'documents', label: 'Documents', icon: Upload },
    { value: 'submit', label: 'Submit', icon: CheckCircle },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-secondary/30 p-1 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={!unlockedTabs.includes(tab.value)}
                className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="applicant" className="mt-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Applicant Information
              </h2>
              <p className="text-muted-foreground mb-8">
                Please provide your personal and professional details
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleApplicantNext(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={applicantData.firstName}
                      onChange={(e) => setApplicantData({ ...applicantData, firstName: e.target.value })}
                      required
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={applicantData.lastName}
                      onChange={(e) => setApplicantData({ ...applicantData, lastName: e.target.value })}
                      required
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@fiu.edu"
                      value={applicantData.email}
                      onChange={(e) => setApplicantData({ ...applicantData, email: e.target.value })}
                      required
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+90 XXX XXX XX XX"
                      value={applicantData.phone}
                      onChange={(e) => setApplicantData({ ...applicantData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="department">Faculty/Department *</Label>
                    <Input
                      id="department"
                      value={applicantData.department}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position *</Label>
                    <Select
                      value={applicantData.position}
                      onValueChange={(value) => setApplicantData({ ...applicantData, position: value })}
                      required
                    >
                      <SelectTrigger id="position">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="associate">Associate Professor</SelectItem>
                        <SelectItem value="assistant">Assistant Professor</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                        <SelectItem value="phd">PhD Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Next: Research Details
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="research" className="mt-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Research Project Details
              </h2>
              <p className="text-muted-foreground mb-8">
                Provide comprehensive information about your research project
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleResearchNext(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectTitle">Project Title *</Label>
                  <Input
                    id="projectTitle"
                    placeholder="Enter the title of your research project"
                    value={researchData.projectTitle}
                    onChange={(e) => setResearchData({ ...researchData, projectTitle: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Project Description *</Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Provide a detailed description of your research project, including objectives, methodology, and expected outcomes"
                    className="min-h-[150px]"
                    value={researchData.projectDescription}
                    onChange={(e) => setResearchData({ ...researchData, projectDescription: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Minimum 50 characters required</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="researchType">Research Type *</Label>
                  <Select
                    value={researchData.researchType}
                    onValueChange={(value) => setResearchData({ ...researchData, researchType: value })}
                    required
                  >
                    <SelectTrigger id="researchType">
                      <SelectValue placeholder="Select research type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="survey">Survey/Questionnaire</SelectItem>
                      <SelectItem value="clinical">Clinical Trial</SelectItem>
                      <SelectItem value="observational">Observational Study</SelectItem>
                      <SelectItem value="experimental">Experimental Research</SelectItem>
                      <SelectItem value="interview">Interview/Focus Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Expected Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={researchData.startDate}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setResearchData({ ...researchData, startDate: selectedDate });
                        // Clear error when user changes date
                        setDateErrors(prev => ({ ...prev, startDate: '' }));
                        // If end date is before new start date, clear it and show error
                        if (researchData.endDate && selectedDate) {
                          const start = new Date(selectedDate);
                          const end = new Date(researchData.endDate);
                          const minEndDate = new Date(start);
                          minEndDate.setDate(minEndDate.getDate() + 21);

                          if (end < minEndDate) {
                            setResearchData(prev => ({ ...prev, endDate: '' }));
                            setDateErrors(prev => ({ ...prev, endDate: 'End date must be at least 3 weeks after start date' }));
                          }
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (researchData.startDate) {
                          const startDate = new Date(researchData.startDate);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          if (startDate < today) {
                            setDateErrors(prev => ({ ...prev, startDate: 'Start date cannot be in the past' }));
                          }
                        }
                      }}
                      min={getTodayDate()}
                      required
                      className={dateErrors.startDate ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {dateErrors.startDate && (
                      <p className="text-xs text-destructive">{dateErrors.startDate}</p>
                    )}
                    {!dateErrors.startDate && (
                      <p className="text-xs text-muted-foreground">Start date cannot be in the past</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Expected End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={researchData.endDate}
                      onChange={(e) => {
                        setResearchData({ ...researchData, endDate: e.target.value });
                        // Clear error when user changes date
                        setDateErrors(prev => ({ ...prev, endDate: '' }));
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (researchData.endDate && researchData.startDate) {
                          const endDate = new Date(researchData.endDate);
                          const startDate = new Date(researchData.startDate);
                          if (endDate <= startDate) {
                            setDateErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
                          }
                        }
                      }}
                      min={getMinEndDate()}
                      required
                      className={dateErrors.endDate ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {dateErrors.endDate && (
                      <p className="text-xs text-destructive">{dateErrors.endDate}</p>
                    )}
                    {!dateErrors.endDate && (
                      <p className="text-xs text-muted-foreground">
                        {!researchData.startDate
                          ? 'Please select start date first'
                          : 'End date must be after start date'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingSource">Funding Source *</Label>
                  <Input
                    id="fundingSource"
                    placeholder="Enter funding source"
                    value={researchData.fundingSource}
                    onChange={(e) => setResearchData({ ...researchData, fundingSource: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('applicant')}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Next: Participants
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Participant Information
              </h2>
              <p className="text-muted-foreground mb-8">
                Details about the research participants
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleParticipantsNext(); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="participantCount">Expected Number of Participants *</Label>
                  <Input
                    id="participantCount"
                    type="number"
                    placeholder="e.g., 50"
                    value={participantsData.participantCount}
                    onChange={(e) => setParticipantsData({ ...participantsData, participantCount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageGroup">Participant Age Group *</Label>
                  <Select
                    value={participantsData.ageGroup}
                    onValueChange={(value) => setParticipantsData({ ...participantsData, ageGroup: value })}
                    required
                  >
                    <SelectTrigger id="ageGroup">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed Ages</SelectItem>
                      <SelectItem value="children">Children (0-17)</SelectItem>
                      <SelectItem value="adults">Adults (18-64)</SelectItem>
                      <SelectItem value="elderly">Elderly (65+)</SelectItem>
                      <SelectItem value="young-adults">Young Adults (18-30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recruitmentMethod">Recruitment Method *</Label>
                  <Textarea
                    id="recruitmentMethod"
                    placeholder="Describe how you will recruit participants for your study"
                    className="min-h-[120px]"
                    value={participantsData.recruitmentMethod}
                    onChange={(e) => setParticipantsData({ ...participantsData, recruitmentMethod: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vulnerablePopulations">Vulnerable Populations</Label>
                  <Textarea
                    id="vulnerablePopulations"
                    placeholder="If your study involves vulnerable populations (e.g., prisoners, pregnant women, mentally disabled), please describe the additional protections you will implement"
                    className="min-h-[120px]"
                    value={participantsData.vulnerablePopulations}
                    onChange={(e) => setParticipantsData({ ...participantsData, vulnerablePopulations: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">Leave blank if not applicable</p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('research')}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Next: Ethics
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="ethics" className="mt-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Ethical Considerations
              </h2>
              <p className="text-muted-foreground mb-8">
                Address key ethical aspects of your research
              </p>

              <form onSubmit={(e) => { e.preventDefault(); handleEthicsNext(); }} className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg bg-background">
                    <Checkbox
                      id="informedConsent"
                      checked={ethicsData.informedConsent}
                      onCheckedChange={(checked) => setEthicsData({ ...ethicsData, informedConsent: checked as boolean })}
                      required
                    />
                    <div className="space-y-1">
                      <Label htmlFor="informedConsent" className="text-base font-semibold cursor-pointer">
                        Informed Consent *
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I will obtain informed consent from all participants or their legal guardians
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border border-border rounded-lg bg-background">
                    <Checkbox
                      id="dataConfidentiality"
                      checked={ethicsData.dataConfidentiality}
                      onCheckedChange={(checked) => setEthicsData({ ...ethicsData, dataConfidentiality: checked as boolean })}
                      required
                    />
                    <div className="space-y-1">
                      <Label htmlFor="dataConfidentiality" className="text-base font-semibold cursor-pointer">
                        Data Confidentiality *
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I will maintain the confidentiality and security of all participant data
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskAssessment">Risk Assessment *</Label>
                  <Textarea
                    id="riskAssessment"
                    placeholder="Describe any potential risks to participants and how you will minimize them"
                    className="min-h-[120px]"
                    value={ethicsData.riskAssessment}
                    onChange={(e) => setEthicsData({ ...ethicsData, riskAssessment: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedBenefits">Expected Benefits *</Label>
                  <Textarea
                    id="expectedBenefits"
                    placeholder="Describe the potential benefits of this research to participants and/or society"
                    className="min-h-[120px]"
                    value={ethicsData.expectedBenefits}
                    onChange={(e) => setEthicsData({ ...ethicsData, expectedBenefits: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('participants')}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Next: Documents
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Supporting Documents
              </h2>

              {existingDocuments.length > 0 && (
                <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Previously Uploaded Documents
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {existingDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-background border border-border rounded-md">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{doc.file_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Existing</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    These documents are attached to your application. Total documents: {existingDocuments.length}. You can upload more below.
                  </p>
                </div>
              )}

              <p className="text-muted-foreground mb-6">
                Upload all required documents related to your research study. All 5 documents are mandatory.
              </p>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-primary font-semibold">Document Requirements</h3>
                  <span className={`text-sm font-medium ${Object.values(documentFiles).filter(f => f !== null).length >= 5 ? 'text-green-600' : 'text-destructive'}`}>
                    {Object.values(documentFiles).filter(f => f !== null).length}/5 documents uploaded
                  </span>
                </div>
                <p className="text-sm text-primary">
                  Please upload all 5 required documents in the designated fields below. Accepted formats: PDF, DOC, DOCX (Maximum 10MB per file)
                </p>
              </div>

              <div className="space-y-8">
                {/* 1. Informed Consent Form */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">1. Informed Consent Form <span className="text-destructive">*</span></h3>
                  <p className="text-sm text-muted-foreground">Upload the consent form that participants will sign</p>
                  <input
                    ref={fileInputRefs.informedConsent}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange('informedConsent')}
                  />
                  {documentFiles.informedConsent ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{documentFiles.informedConsent.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(documentFiles.informedConsent.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeFile('informedConsent')} className="h-8 w-8 p-0">×</Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${draggingField === 'informedConsent' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      onClick={handleUploadClick('informedConsent')}
                      onDragOver={handleDragOver('informedConsent')}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop('informedConsent')}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm mb-1"><span className="text-primary font-medium">Click to upload</span> <span className="text-muted-foreground">or drag and drop</span></p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* 2. Research Protocol or Proposal */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">2. Research Protocol or Proposal <span className="text-destructive">*</span></h3>
                  <p className="text-sm text-muted-foreground">Upload your detailed research protocol or proposal document</p>
                  <input
                    ref={fileInputRefs.researchProtocol}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange('researchProtocol')}
                  />
                  {documentFiles.researchProtocol ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{documentFiles.researchProtocol.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(documentFiles.researchProtocol.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeFile('researchProtocol')} className="h-8 w-8 p-0">×</Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${draggingField === 'researchProtocol' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      onClick={handleUploadClick('researchProtocol')}
                      onDragOver={handleDragOver('researchProtocol')}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop('researchProtocol')}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm mb-1"><span className="text-primary font-medium">Click to upload</span> <span className="text-muted-foreground">or drag and drop</span></p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* 3. Data Collection Instruments */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">3. Data Collection Instruments (Surveys, Questionnaires, etc.) <span className="text-destructive">*</span></h3>
                  <p className="text-sm text-muted-foreground">Upload your surveys, questionnaires, or other data collection tools</p>
                  <input
                    ref={fileInputRefs.dataCollection}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange('dataCollection')}
                  />
                  {documentFiles.dataCollection ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{documentFiles.dataCollection.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(documentFiles.dataCollection.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeFile('dataCollection')} className="h-8 w-8 p-0">×</Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${draggingField === 'dataCollection' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      onClick={handleUploadClick('dataCollection')}
                      onDragOver={handleDragOver('dataCollection')}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop('dataCollection')}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm mb-1"><span className="text-primary font-medium">Click to upload</span> <span className="text-muted-foreground">or drag and drop</span></p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* 4. Institutional Approvals */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">4. Institutional Approvals <span className="text-destructive">*</span></h3>
                  <p className="text-sm text-muted-foreground">Upload any institutional approval documents if required for your research</p>
                  <input
                    ref={fileInputRefs.institutionalApprovals}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange('institutionalApprovals')}
                  />
                  {documentFiles.institutionalApprovals ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{documentFiles.institutionalApprovals.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(documentFiles.institutionalApprovals.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeFile('institutionalApprovals')} className="h-8 w-8 p-0">×</Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${draggingField === 'institutionalApprovals' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      onClick={handleUploadClick('institutionalApprovals')}
                      onDragOver={handleDragOver('institutionalApprovals')}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop('institutionalApprovals')}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm mb-1"><span className="text-primary font-medium">Click to upload</span> <span className="text-muted-foreground">or drag and drop</span></p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* 5. Any Other Relevant Documentation */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">5. Any Other Relevant Documentation <span className="text-destructive">*</span></h3>
                  <p className="text-sm text-muted-foreground">Upload any additional documents that support your application</p>
                  <input
                    ref={fileInputRefs.otherDocuments}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange('otherDocuments')}
                  />
                  {documentFiles.otherDocuments ? (
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{documentFiles.otherDocuments.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(documentFiles.otherDocuments.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeFile('otherDocuments')} className="h-8 w-8 p-0">×</Button>
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${draggingField === 'otherDocuments' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      onClick={handleUploadClick('otherDocuments')}
                      onDragOver={handleDragOver('otherDocuments')}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop('otherDocuments')}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm mb-1"><span className="text-primary font-medium">Click to upload</span> <span className="text-muted-foreground">or drag and drop</span></p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertDescription className="text-sm">
                    <span className="font-semibold text-foreground">Note:</span>{' '}
                    <span className="text-foreground">
                      All documents must be in English or accompanied by certified translations.
                      Please ensure all participant information is de-identified in uploaded documents.
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="skipDocuments"
                    checked={skipDocuments}
                    onCheckedChange={(checked) => setSkipDocuments(checked as boolean)}
                  />
                  <Label htmlFor="skipDocuments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Skip document upload (I do not need to upload any documents for this research)
                  </Label>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('ethics')}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDocumentsNext}
                    disabled={!skipDocuments && Object.values(documentFiles).filter(f => f !== null).length < 5}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {Object.values(documentFiles).filter(f => f !== null).length < 5
                      ? `Upload ${5 - Object.values(documentFiles).filter(f => f !== null).length} more document(s)`
                      : 'Next: Review & Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="submit" className="mt-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Declaration and Submission
              </h2>
              <p className="text-muted-foreground mb-8">
                Please review and confirm before submitting
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                  <h3 className="text-lg font-semibold text-primary mb-4">
                    Review Checklist
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-primary">
                      <span>✓</span>
                      <span>All required fields have been completed</span>
                    </li>
                    <li className="flex items-start gap-2 text-primary">
                      <span>✓</span>
                      <span>Research methodology is clearly described</span>
                    </li>
                    <li className="flex items-start gap-2 text-primary">
                      <span>✓</span>
                      <span>Ethical considerations have been addressed</span>
                    </li>
                    <li className="flex items-start gap-2 text-primary">
                      <span>✓</span>
                      <span>Participant protections are in place</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-6 border border-border rounded-lg bg-background">
                    <Checkbox
                      id="accuracyDeclaration"
                      checked={submitData.accuracyDeclaration}
                      onCheckedChange={(checked) => setSubmitData({ ...submitData, accuracyDeclaration: checked as boolean })}
                      required
                    />
                    <div className="space-y-1">
                      <Label htmlFor="accuracyDeclaration" className="text-base font-semibold cursor-pointer">
                        Accuracy Declaration *
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I declare that all information provided in this application is accurate and complete to the best of my knowledge
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-6 border border-border rounded-lg bg-background">
                    <Checkbox
                      id="complianceAgreement"
                      checked={submitData.complianceAgreement}
                      onCheckedChange={(checked) => setSubmitData({ ...submitData, complianceAgreement: checked as boolean })}
                      required
                    />
                    <div className="space-y-1">
                      <Label htmlFor="complianceAgreement" className="text-base font-semibold cursor-pointer">
                        Compliance Agreement *
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I agree to comply with all ethical guidelines and regulations set forth by Final International University Ethics Committee
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertDescription className="text-sm">
                    <span className="font-semibold text-foreground">Note:</span>{' '}
                    <span className="text-foreground">
                      All documents must be in English or accompanied by certified translations.
                      Please ensure all participant information is de-identified in uploaded documents.
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    type="submit"
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    Submit Application
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const NewApplication = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <DashboardSidebar />
        <NewApplicationContent />
      </div>
    </SidebarProvider>
  );
};

export default NewApplication;
