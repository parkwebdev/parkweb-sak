import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ProgressBar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface OnboardingData {
  // Company Information
  companyName: string;
  industry: string;
  website: string;
  companyDescription: string;
  
  // Contact Information
  contactName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  
  // Project Information
  projectGoals: string;
  targetAudience: string;
  keyFeatures: string[];
  
  // Additional Information
  currentWebsite: string;
  competitorSites: string;
  brandingAssets: boolean;
  brandingFiles: FileList | null;
  contentReady: boolean;
  additionalNotes: string;
  
  currentStep: number;
}

const industryOptions = [
  'RV Park/Resort',
  'Manufactured Home Community',
  'Local Business (Service-Based)',
  'National Business',
  'Capital & Syndication Company',
  'Healthcare',
  'Education',
  'Non-profit',
  'E-commerce',
  'Other'
];

const featureOptions = [
  'Online Booking System',
  'Payment Processing',
  'Customer Portal',
  'Inventory Management',
  'Appointment Scheduling',
  'Blog/News Section',
  'Photo Gallery',
  'Contact Forms',
  'Live Chat',
  'Social Media Integration',
  'SEO Optimization',
  'Analytics Dashboard'
];

const steps = [
  { id: 1, title: 'Welcome', description: 'Getting started' },
  { id: 2, title: 'Company Info', description: 'Tell us about your business' },
  { id: 3, title: 'Contact Details', description: 'Your contact information' },
  { id: 4, title: 'Project Goals', description: 'What you want to achieve' },
  { id: 5, title: 'Features', description: 'Project specifications' },
  { id: 6, title: 'Additional Info', description: 'Final details' },
  { id: 7, title: 'Review & Submit', description: 'Confirm your information' }
];

// Auto-generated SOW content based on form data
const generateScopeOfWork = (data: OnboardingData) => {
  const universalFeatures = [
    'Professional Header with Logo and Navigation',
    'Footer with Contact Information and Legal Links',
    'Fully Responsive Design (Desktop, Tablet, Mobile)',
    'SEO Optimization (Meta Tags, Alt Text, Headings)',
    'Contact Forms and Methods',
    'Call-to-Action Buttons Throughout Site'
  ];

  const industryFeatures: { [key: string]: string[] } = {
    'RV Park/Resort': [
      'Facilities & Amenities Showcase',
      'Rates & Pricing Page',
      'Interactive Park Map',
      'Online Booking System',
      'Photo Gallery of Amenities',
      'Things To Do in Area',
      'Resident Portal Access'
    ],
    'Manufactured Home Community': [
      'Available Homes Listings',
      'Community Features Page',
      'Lot Rent & Pricing',
      'Application Process',
      'Resident Portal',
      'Community Events Calendar',
      'Photo Gallery'
    ],
    'Local Business (Service-Based)': [
      'Services Overview Pages',
      'Customer Testimonials Section',
      'Portfolio/Case Studies',
      'FAQ Section',
      'Appointment Booking System',
      'Service Area Map',
      'About Us/Team Page'
    ],
    'National Business': [
      'Services/Solutions Overview',
      'Industries Served Pages',
      'Locations/Service Areas',
      'Resources Section (Blog, Downloads)',
      'Careers Page',
      'Case Studies/Success Stories',
      'Contact Forms by Location'
    ],
    'Capital & Syndication Company': [
      'Investor Relations Portal',
      'Portfolio/Past Deals Showcase',
      'Team & Leadership Bios',
      'How Investment Process Works',
      'FAQ for Investors',
      'Legal/Compliance Pages',
      'Secure Document Access'
    ]
  };

  return {
    projectOverview: {
      clientName: data.companyName,
      projectType: 'Professional Website Design & Development',
      industry: data.industry,
      goals: data.projectGoals.split(',').map(goal => goal.trim())
    },
    websiteStructure: {
      universalPages: [
        'Home Page',
        'About Us',
        'Contact Us',
        'Privacy Policy',
        'Terms of Service'
      ],
      industrySpecificPages: industryFeatures[data.industry] || [],
      selectedFeatures: data.keyFeatures
    },
    contentRequirements: {
      weProvide: [
        'Professional website design & development',
        'Technical integrations and functionality',
        'Content formatting & optimization',
        'SEO setup & responsive design',
        'Testing and quality assurance',
        'Initial training and handoff'
      ],
      clientProvides: [
        'Logo files (preferably SVG format)',
        'High-quality photos and media',
        'Written content and copy',
        'Branding guidelines (colors, fonts)',
        'Integration credentials (if applicable)',
        'Legal documents (policies, terms)'
      ]
    },
    features: [...universalFeatures, ...(industryFeatures[data.industry] || [])],
    nextSteps: [
      'Review and approve this Scope of Work',
      'Provide initial content and assets',
      'Schedule project kickoff meeting',
      'Begin design phase',
      'Regular progress reviews'
    ]
  };
};

const ClientOnboarding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientName = searchParams.get('name') || 'Valued Client';
  const companyName = searchParams.get('company') || 'Your Company';

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: companyName,
    industry: '',
    website: '',
    companyDescription: '',
    contactName: clientName,
    title: '',
    email: '',
    phone: '',
    address: '',
    projectGoals: '',
    targetAudience: '',
    keyFeatures: [],
    currentWebsite: '',
    competitorSites: '',
    brandingAssets: false,
    brandingFiles: null,
    contentReady: false,
    additionalNotes: '',
    currentStep: 1
  });

  const [showSOW, setShowSOW] = useState(false);
  const [sowData, setSowData] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate progress percentage based on current step
  const getProgressPercentage = () => {
    return Math.round((onboardingData.currentStep / steps.length) * 100);
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setOnboardingData(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures.includes(feature)
        ? prev.keyFeatures.filter(f => f !== feature)
        : [...prev.keyFeatures, feature]
    }));
  };

  const nextStep = () => {
    if (onboardingData.currentStep < steps.length) {
      updateData('currentStep', onboardingData.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (onboardingData.currentStep > 1) {
      updateData('currentStep', onboardingData.currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const generatedSOW = generateScopeOfWork(onboardingData);
    setSowData(generatedSOW);
    setShowSOW(true);
  };

  const handleFinalSubmit = () => {
    setIsSubmitted(true);
    setShowSOW(false);
    // Here you would typically send the data to your backend
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center relative">
        <div className="fixed bottom-6 left-6">
          <ThemeToggle />
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center p-12">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Thank you, {clientName}!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your onboarding form and scope of work have been submitted successfully.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
              <ul className="text-left text-green-700 space-y-2">
                <li>• Our team will review your submission within 24 hours</li>
                <li>• We'll contact you to discuss any questions or clarifications</li>
                <li>• Once approved, we'll send you a project proposal and contract</li>
                <li>• After signing, we'll schedule your project kickoff meeting</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              If you have any questions, feel free to contact us at info@yourwebdesigncompany.com
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (onboardingData.currentStep) {
      case 1:
        return (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary text-2xl font-bold">★</span>
              </div>
              <CardTitle className="text-2xl">Welcome, {clientName}!</CardTitle>
              <CardDescription className="text-lg">
                We're excited to work with {companyName} on your new website project. 
                This onboarding process will help us understand your needs and create the perfect website for your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">What to expect:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>7 simple steps to complete</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Takes about 10-15 minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Your progress is automatically saved</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>We'll generate a custom scope of work for you to review</span>
                  </li>
                </ul>
              </div>
              <p className="text-muted-foreground text-center">
                Ready to get started? Let's build something amazing together!
              </p>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                Tell us about {companyName}
              </CardTitle>
              <CardDescription>
                Help us understand your business so we can create a website that perfectly represents your brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium mb-2 block">Company Name *</Label>
                <Input
                  id="companyName"
                  value={onboardingData.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry" className="text-sm font-medium mb-2 block">Industry *</Label>
                <Select value={onboardingData.industry} onValueChange={(value) => updateData('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {industryOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website" className="text-sm font-medium mb-2 block">Current Website (if any)</Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={onboardingData.website}
                  onChange={(e) => updateData('website', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyDescription" className="text-sm font-medium mb-2 block">Brief Company Description *</Label>
                <Textarea
                  id="companyDescription"
                  placeholder="Tell us what your company does and what makes it special..."
                  value={onboardingData.companyDescription}
                  onChange={(e) => updateData('companyDescription', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                Contact Information
              </CardTitle>
              <CardDescription>
                We'll use this information to keep you updated on your project's progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName" className="text-sm font-medium mb-2 block">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={onboardingData.contactName}
                    onChange={(e) => updateData('contactName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="title" className="text-sm font-medium mb-2 block">Job Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., CEO, Marketing Manager"
                    value={onboardingData.title}
                    onChange={(e) => updateData('title', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={onboardingData.email}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Auto-correct common typos
                      value = value.replace(/\.con$/, '.com');
                      value = value.replace(/\.cmo$/, '.com');
                      value = value.replace(/\.ocm$/, '.com');
                      value = value.replace(/\.gmai\./, '.gmail.');
                      value = value.replace(/\.yahho\./, '.yahoo.');
                      updateData('email', value);
                    }}
                    className={`${onboardingData.email && !isValidEmail(onboardingData.email) ? 'border-destructive' : ''}`}
                  />
                  {onboardingData.email && !isValidEmail(onboardingData.email) && (
                    <p className="text-sm text-destructive mt-1">Please enter a valid email address</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium mb-2 block">Phone Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
                      🇺🇸 +1
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={onboardingData.phone}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 3) {
                          value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}${value.length > 6 ? '-' + value.slice(6, 10) : ''}`;
                        }
                        updateData('phone', value);
                      }}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="text-sm font-medium mb-2 block">Business Address</Label>
                <Textarea
                  id="address"
                  placeholder="Street address, city, state, zip code"
                  value={onboardingData.address}
                  onChange={(e) => updateData('address', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                Project Goals & Audience
              </CardTitle>
              <CardDescription>
                Help us understand what you want to achieve with your new website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="projectGoals" className="text-sm font-medium mb-2 block">What are your main goals for this website? *</Label>
                <Textarea
                  id="projectGoals"
                  placeholder="e.g., Increase online bookings, showcase our services, improve customer communication..."
                  value={onboardingData.projectGoals}
                  onChange={(e) => updateData('projectGoals', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="targetAudience" className="text-sm font-medium mb-2 block">Who is your target audience? *</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="e.g., Families looking for RV parks, small businesses needing plumbing services..."
                  value={onboardingData.targetAudience}
                  onChange={(e) => updateData('targetAudience', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Features & Timeline</CardTitle>
              <CardDescription>
                Select the features you'd like on your website and let us know your timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Which features would you like? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {featureOptions.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={onboardingData.keyFeatures.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                      />
                      <Label htmlFor={feature} className="text-sm font-normal">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                A few more details to help us prepare for your project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="competitorSites" className="text-sm font-medium mb-2 block">Competitor websites you admire (optional)</Label>
                <Textarea
                  id="competitorSites"
                  placeholder="List any websites you like and what you like about them..."
                  value={onboardingData.competitorSites}
                  onChange={(e) => updateData('competitorSites', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="brandingAssets"
                    checked={onboardingData.brandingAssets}
                    onCheckedChange={(checked) => updateData('brandingAssets', checked)}
                  />
                  <Label htmlFor="brandingAssets">
                    I have existing branding assets (logo, colors, fonts)
                  </Label>
                </div>
                
                {onboardingData.brandingAssets && (
                  <div className="ml-6 p-4 border rounded-lg bg-muted/30">
                    <Label htmlFor="brandingFiles" className="text-sm font-medium mb-2 block">
                      Upload Branding Assets
                    </Label>
                    <Input
                      id="brandingFiles"
                      type="file"
                      multiple
                      accept=".svg,.eps,.ai,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => updateData('brandingFiles', e.target.files)}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      We prefer vector formats like SVG, EPS, AI, or PDF files when possible. 
                      You can also upload high-resolution PNG or JPG files.
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="contentReady"
                    checked={onboardingData.contentReady}
                    onCheckedChange={(checked) => updateData('contentReady', checked)}
                  />
                  <Label htmlFor="contentReady">
                    I have content ready (text, images, videos)
                  </Label>
                </div>
              </div>
              <div>
                <Label htmlFor="additionalNotes" className="text-sm font-medium mb-2 block">Additional notes or questions</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Anything else you'd like us to know about your project..."
                  value={onboardingData.additionalNotes}
                  onChange={(e) => updateData('additionalNotes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Please review your information before submitting. We'll generate a custom scope of work for you to review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div>
                  <strong>Company:</strong> {onboardingData.companyName}
                </div>
                <div>
                  <strong>Industry:</strong> {onboardingData.industry}
                </div>
                <div>
                  <strong>Contact:</strong> {onboardingData.contactName} ({onboardingData.email})
                </div>
                <div>
                  <strong>Selected Features:</strong> {onboardingData.keyFeatures.length} features selected
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• We'll generate a custom Scope of Work based on your answers</li>
                  <li>• You can review and request changes to the scope</li>
                  <li>• Once you approve, we'll receive your submission</li>
                  <li>• Our team will contact you within 24 hours to get started</li>
                </ul>
              </div>

              <Button className="w-full px-6 py-2" size="lg" onClick={handleSubmit}>
                Generate My Scope of Work
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-muted/30 relative">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-foreground mb-2">Website Project Onboarding</h1>
              <h2 className="text-xl font-semibold text-foreground">
                {steps[onboardingData.currentStep - 1]?.title}
              </h2>
              <p className="text-muted-foreground mb-4">
                {steps[onboardingData.currentStep - 1]?.description}
              </p>
            </div>
            <ProgressBar 
              percentage={getProgressPercentage()} 
              className="max-w-md mx-auto"
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Step {onboardingData.currentStep} of {steps.length}
            </p>
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
              disabled={onboardingData.currentStep === 1}
              className="px-6 py-2"
            >
              Previous
            </Button>
            <Button 
              onClick={nextStep} 
              disabled={onboardingData.currentStep === steps.length}
              className="px-6 py-2"
            >
              {onboardingData.currentStep === steps.length ? 'Complete' : 'Next Step'}
            </Button>
          </div>
        </div>
        
        {/* Theme toggle in bottom left corner */}
        <div className="fixed bottom-6 left-6">
          <ThemeToggle />
        </div>
      </div>

      {/* Scope of Work Review Dialog */}
      <Dialog open={showSOW} onOpenChange={setShowSOW}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Your Custom Scope of Work
            </DialogTitle>
            <DialogDescription>
              Review the generated scope of work. You can request changes before final submission.
            </DialogDescription>
          </DialogHeader>
          
          {sowData && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Project Overview</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><strong>Client:</strong> {sowData.projectOverview.clientName}</p>
                  <p><strong>Project Type:</strong> {sowData.projectOverview.projectType}</p>
                  <p><strong>Industry:</strong> {sowData.projectOverview.industry}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Website Structure</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Universal Pages</h4>
                    <ul className="text-sm space-y-1">
                      {sowData.websiteStructure.universalPages.map((page, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          {page}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Industry-Specific Pages</h4>
                    <ul className="text-sm space-y-1">
                      {sowData.websiteStructure.industrySpecificPages.map((page, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="text-blue-500">✓</span>
                          {page}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Selected Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {sowData.websiteStructure.selectedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-primary">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShowSOW(false)} className="px-6 py-2">
                  Request Changes
                </Button>
                <Button onClick={handleFinalSubmit} className="px-6 py-2">
                  Approve & Submit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientOnboarding;