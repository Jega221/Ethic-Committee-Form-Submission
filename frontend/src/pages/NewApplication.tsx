import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Users, Shield, Upload, CheckCircle, CheckCircle2 } from 'lucide-react';
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
  const { setOpen } = useSidebar();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applicant');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleResearchNext = () => {
    validateAndProceed('research', 'participants', researchSchema, researchData);
  };

  const handleParticipantsNext = () => {
    validateAndProceed('participants', 'ethics', participantsSchema, participantsData);
  };

  const handleEthicsNext = () => {
    validateAndProceed('ethics', 'documents', ethicsSchema, ethicsData);
  };

  const handleDocumentsNext = () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one document",
        variant: "destructive",
      });
      return;
    }
    setActiveTab('submit');
    if (!unlockedTabs.includes('submit')) {
      setUnlockedTabs([...unlockedTabs, 'submit']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      submitSchema.parse(submitData);
      const refNum = `EC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, '0')}`;
      setReferenceNumber(refNum);
      setIsSubmitted(true);
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

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const handleSubmitAnother = () => {
    setIsSubmitted(false);
    setActiveTab('applicant');
    setUploadedFiles([]);
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
                      onChange={(e) => setApplicantData({...applicantData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={applicantData.lastName}
                      onChange={(e) => setApplicantData({...applicantData, lastName: e.target.value})}
                      required
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
                      onChange={(e) => setApplicantData({...applicantData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+90 XXX XXX XX XX"
                      value={applicantData.phone}
                      onChange={(e) => setApplicantData({...applicantData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select 
                      value={applicantData.department}
                      onValueChange={(value) => setApplicantData({...applicantData, department: value})}
                      required
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="psychology">Psychology</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="medicine">Medicine</SelectItem>
                        <SelectItem value="sociology">Sociology</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position *</Label>
                    <Select 
                      value={applicantData.position}
                      onValueChange={(value) => setApplicantData({...applicantData, position: value})}
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
                    className="bg-foreground text-background hover:bg-foreground/90"
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
                    onChange={(e) => setResearchData({...researchData, projectTitle: e.target.value})}
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
                    onChange={(e) => setResearchData({...researchData, projectDescription: e.target.value})}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Minimum 50 characters required</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="researchType">Research Type *</Label>
                  <Select 
                    value={researchData.researchType}
                    onValueChange={(value) => setResearchData({...researchData, researchType: value})}
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
                      onChange={(e) => setResearchData({...researchData, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Expected End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={researchData.endDate}
                      onChange={(e) => setResearchData({...researchData, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingSource">Funding Source *</Label>
                  <Input
                    id="fundingSource"
                    placeholder="Enter funding source"
                    value={researchData.fundingSource}
                    onChange={(e) => setResearchData({...researchData, fundingSource: e.target.value})}
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
                    className="bg-foreground text-background hover:bg-foreground/90"
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
                    onChange={(e) => setParticipantsData({...participantsData, participantCount: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageGroup">Participant Age Group *</Label>
                  <Select 
                    value={participantsData.ageGroup}
                    onValueChange={(value) => setParticipantsData({...participantsData, ageGroup: value})}
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
                    onChange={(e) => setParticipantsData({...participantsData, recruitmentMethod: e.target.value})}
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
                    onChange={(e) => setParticipantsData({...participantsData, vulnerablePopulations: e.target.value})}
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
                    className="bg-foreground text-background hover:bg-foreground/90"
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
                      onCheckedChange={(checked) => setEthicsData({...ethicsData, informedConsent: checked as boolean})}
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
                      onCheckedChange={(checked) => setEthicsData({...ethicsData, dataConfidentiality: checked as boolean})}
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
                    onChange={(e) => setEthicsData({...ethicsData, riskAssessment: e.target.value})}
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
                    onChange={(e) => setEthicsData({...ethicsData, expectedBenefits: e.target.value})}
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
                    className="bg-foreground text-background hover:bg-foreground/90"
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
              <p className="text-muted-foreground mb-8">
                Upload all relevant documents related to your research study
              </p>

              <div className="space-y-6">
                <div className="bg-secondary/30 rounded-lg p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Required Documents
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-primary">Informed consent form</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-primary">Research protocol or proposal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-primary">Data collection instruments (surveys, questionnaires, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-primary">Institutional approvals (if applicable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span className="text-primary">Any other relevant documentation</span>
                    </li>
                  </ul>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />

                <div 
                  className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={handleUploadClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                  <p className="text-sm sm:text-base mb-2 flex flex-wrap items-center justify-center gap-1">
                    <span className="text-primary font-medium">Click to upload</span>
                    <span className="text-muted-foreground">or drag and drop</span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    PDF, DOC, DOCX files up to 10MB
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Uploaded Files ({uploadedFiles.length})
                    </h3>
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-card rounded border border-border">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="flex-shrink-0 h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
                    onClick={() => setActiveTab('ethics')}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleDocumentsNext}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    Next: Review & Submit
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
                      onCheckedChange={(checked) => setSubmitData({...submitData, accuracyDeclaration: checked as boolean})}
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
                      onCheckedChange={(checked) => setSubmitData({...submitData, complianceAgreement: checked as boolean})}
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
