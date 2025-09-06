import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ArrowRight, CheckCircle, FileText, Users, Building2, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectData {
  clientName: string;
  projectType: string;
  industry: string;
  goals: string;
  currentStep: number;
}

const industryOptions = [
  { value: 'local-business', label: 'Local Business (Service-Based)', icon: Building2 },
  { value: 'national-business', label: 'National Business', icon: MapPin },
  { value: 'rv-park', label: 'RV Park/Resort', icon: Users },
  { value: 'manufactured-home', label: 'Manufactured Home Community', icon: Users },
  { value: 'capital-syndication', label: 'Capital & Syndication Company', icon: Briefcase }
];

const steps = [
  { id: 1, title: 'Project Overview', description: 'Basic project information' },
  { id: 2, title: 'Industry Selection', description: 'Choose client industry type' },
  { id: 3, title: 'Goals & Requirements', description: 'Define project objectives' },
  { id: 4, title: 'Website Structure', description: 'Plan site architecture' },
  { id: 5, title: 'Content & Assets', description: 'Media and branding requirements' },
  { id: 6, title: 'Review & Generate', description: 'Finalize Scope of Work' }
];

const Onboarding = () => {
  const [projectData, setProjectData] = useState<ProjectData>({
    clientName: '',
    projectType: 'Web Design',
    industry: '',
    goals: '',
    currentStep: 1
  });

  const updateProjectData = (field: keyof ProjectData, value: string | number) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (projectData.currentStep < steps.length) {
      updateProjectData('currentStep', projectData.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (projectData.currentStep > 1) {
      updateProjectData('currentStep', projectData.currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (projectData.currentStep) {
      case 1:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Welcome to SoW Creation Training
              </CardTitle>
              <CardDescription>
                A Scope of Work (SoW) is essential for both client clarity and internal project management. 
                It serves as a roadmap that defines what will be delivered and helps prevent scope creep.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Snowy Owl Mobile Home Park"
                  value={projectData.clientName}
                  onChange={(e) => updateProjectData('clientName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="projectType">Project Type *</Label>
                <Select value={projectData.projectType} onValueChange={(value) => updateProjectData('projectType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Design">Web Design</SelectItem>
                    <SelectItem value="Branding + Web">Branding + Web Design</SelectItem>
                    <SelectItem value="E-commerce">E-commerce Development</SelectItem>
                    <SelectItem value="Redesign">Website Redesign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Why this matters:</strong> Clear project identification helps set proper expectations 
                  and ensures we're aligned on deliverables from the start.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Industry Selection</CardTitle>
              <CardDescription>
                Different industries require specific features and pages. Selecting the right industry 
                ensures we include all necessary modules for your client's business type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {industryOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      projectData.industry === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateProjectData('industry', option.value)}
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              {projectData.industry && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Industry-specific features will include:</strong>
                    {projectData.industry === 'rv-park' && ' Facilities & Amenities, Rates, Park Map, Booking System, Resident Portal'}
                    {projectData.industry === 'local-business' && ' Services, Testimonials, Portfolio, FAQ, Appointment Booking'}
                    {projectData.industry === 'national-business' && ' Services, Industries Served, Locations Page, Resources, Careers'}
                    {projectData.industry === 'manufactured-home' && ' Home Listings, Rates, Community Features, Resident Portal'}
                    {projectData.industry === 'capital-syndication' && ' Investor Portal, Portfolio, Team Bios, Legal/Compliance Pages'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Project Goals & Requirements</CardTitle>
              <CardDescription>
                Clear goals help us design a website that achieves specific business outcomes. 
                This section becomes crucial for measuring project success.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="goals">Main Project Goals *</Label>
                <Textarea
                  id="goals"
                  placeholder="e.g., Boost bookings by 30%, showcase amenities to attract new residents, streamline payment process for current residents"
                  value={projectData.goals}
                  onChange={(e) => updateProjectData('goals', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Pro tip:</strong> Specific, measurable goals help us design features that drive results. 
                  Vague goals like "look professional" are harder to achieve and measure.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Website Structure Planning</CardTitle>
              <CardDescription>
                Every website needs universal foundation pages, plus industry-specific modules. 
                This ensures nothing important is missed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Universal Foundation (Always Included)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Header & Navigation
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Footer with Contact Info
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Responsive Design
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    SEO Optimization
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Contact Methods
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Call-to-Action Buttons
                  </div>
                </div>
              </div>

              {projectData.industry && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Industry-Specific Pages
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {projectData.industry === 'rv-park' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Facilities & Amenities Showcase
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Rates & Pricing Page
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Interactive Park Map
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Online Booking System
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Resident Portal Access
                        </div>
                      </>
                    )}
                    {projectData.industry === 'local-business' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Services/Products Showcase
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Customer Testimonials
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Portfolio/Case Studies
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          FAQ Section
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Appointment Booking
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Why this structure matters:</strong> Universal pages ensure professional standards, 
                  while industry-specific modules address unique business needs. This prevents both 
                  over-engineering and missing critical features.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Content & Asset Requirements</CardTitle>
              <CardDescription>
                Defining what the client provides vs. what we create prevents delays and clarifies responsibilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-600">What We Provide:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Professional website design & development
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Technical integrations (booking, payments, CRM)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Content formatting & optimization
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    SEO setup & responsive design
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-blue-600">What Client Provides:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    Logo files (preferably SVG format)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    High-quality photos (property, team, products)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    Written content & copy
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    Branding guidelines (colors, fonts)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    Integration credentials (booking systems, etc.)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                    Legal documents (policies, terms)
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Pro tip:</strong> Clear responsibility division prevents project delays. 
                  When clients know exactly what to provide and when, projects run smoother and stay on timeline.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Review & Generate SoW</CardTitle>
              <CardDescription>
                Review all information before generating your professional Scope of Work document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-card border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Project Summary:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Company:</strong> {projectData.clientName || 'Not specified'}</p>
                  <p><strong>Project Type:</strong> {projectData.projectType}</p>
                  <p><strong>Industry:</strong> {industryOptions.find(opt => opt.value === projectData.industry)?.label || 'Not selected'}</p>
                  <p><strong>Goals:</strong> {projectData.goals || 'Not specified'}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Ready to Generate!</h4>
                <p className="text-sm text-green-700">
                  Your Scope of Work will include all universal foundation elements plus industry-specific 
                  modules tailored to {projectData.clientName}'s business needs.
                </p>
              </div>

              <Button className="w-full" size="lg">
                Generate Professional SoW Document
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[296px] overflow-auto">
        <main className="flex-1 bg-muted/20 pt-8 pb-12">
          <div className="max-w-4xl mx-auto px-8">
            <header className="mb-8">
              <h1 className="text-foreground text-3xl font-semibold leading-8 tracking-tight mb-2">
                SoW Creation Training
              </h1>
              <p className="text-muted-foreground">
                Learn to create professional Scopes of Work that prevent scope creep and ensure client satisfaction.
              </p>
            </header>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                      step.id === projectData.currentStep 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : step.id < projectData.currentStep 
                        ? 'border-green-500 bg-green-500 text-white' 
                        : 'border-border bg-background text-muted-foreground'
                    }`}>
                      {step.id < projectData.currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-full h-0.5 mx-2 ${
                        step.id < projectData.currentStep ? 'bg-green-500' : 'bg-border'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  {steps[projectData.currentStep - 1]?.title}
                </h2>
                <p className="text-muted-foreground">
                  {steps[projectData.currentStep - 1]?.description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={projectData.currentStep === 1}
              >
                Previous
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={
                  projectData.currentStep === steps.length ||
                  (projectData.currentStep === 1 && !projectData.clientName) ||
                  (projectData.currentStep === 2 && !projectData.industry) ||
                  (projectData.currentStep === 3 && !projectData.goals)
                }
                className="flex items-center gap-2"
              >
                {projectData.currentStep === steps.length ? 'Complete' : 'Next Step'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Onboarding;