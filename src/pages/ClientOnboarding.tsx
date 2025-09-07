import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Badge } from '@/components/ui/badge';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { UploadCloud01, Plus, X } from '@untitledui/icons';

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
  audienceTags: string[];
  keyFeatures: string[];
  
  // Additional Information
  currentWebsite: string;
  competitorWebsites: string[];
  brandingAssets: boolean;
  brandingFiles: FileList | null;
  contentReady: boolean;
  contentFiles: FileList | null;
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

const audienceTagsByIndustry = {
  'RV Park/Resort': ['Families', 'Retirees', 'Adventure Travelers', 'Seasonal Visitors', 'Pet Owners', 'Outdoor Enthusiasts'],
  'Manufactured Home Community': ['First-time Homebuyers', 'Retirees', 'Young Families', 'Budget-conscious Buyers', 'Local Residents'],
  'Local Business (Service-Based)': ['Local Residents', 'Homeowners', 'Small Businesses', 'Emergency Services', 'Repeat Customers'],
  'National Business': ['Enterprise Clients', 'Small Businesses', 'Industry Professionals', 'Decision Makers', 'B2B Customers'],
  'Capital & Syndication Company': ['Accredited Investors', 'High Net Worth Individuals', 'Investment Groups', 'Real Estate Investors', 'Institutional Investors'],
  'Healthcare': ['Patients', 'Families', 'Insurance Providers', 'Medical Professionals', 'Elderly Care'],
  'Education': ['Students', 'Parents', 'Educators', 'Alumni', 'Academic Staff'],
  'Non-profit': ['Donors', 'Volunteers', 'Community Members', 'Grant Organizations', 'Beneficiaries'],
  'E-commerce': ['Online Shoppers', 'Mobile Users', 'Bargain Hunters', 'Loyal Customers', 'Social Media Users'],
  'Other': ['General Public', 'Target Demographics', 'Local Community', 'Online Users', 'Service Seekers']
};

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
    audienceTags: [],
    keyFeatures: [],
    currentWebsite: '',
    competitorWebsites: [''],
    brandingAssets: false,
    brandingFiles: null,
    contentReady: false,
    contentFiles: null,
    additionalNotes: '',
    currentStep: 1
  });

  const [showSOW, setShowSOW] = useState(false);
  const [sowData, setSowData] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGeneratingSOW, setIsGeneratingSOW] = useState(false);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation for each step
  const validateCurrentStep = (): boolean => {
    const { currentStep } = onboardingData;
    
    switch (currentStep) {
      case 1:
        return true; // Welcome step
      case 2:
        return !!(
          onboardingData.companyName?.trim() &&
          onboardingData.industry?.trim() &&
          onboardingData.companyDescription?.trim()
        );
      case 3:
        return !!(
          onboardingData.contactName?.trim() &&
          onboardingData.email?.trim() &&
          isValidEmail(onboardingData.email)
        );
      case 4:
        return !!(
          onboardingData.projectGoals?.trim() &&
          onboardingData.targetAudience?.trim()
        );
      case 5:
        return true; // Features are optional
      case 6:
        return true; // Additional info is optional
      case 7:
        return true; // Review step
      default:
        return false;
    }
  };

    // Auto-save functionality
    React.useEffect(() => {
      const saveInterval = setInterval(() => {
        if (onboardingData.currentStep > 1) {
          localStorage.setItem('onboardingDraft', JSON.stringify(onboardingData));
        }
      }, 30000); // Save every 30 seconds

      return () => clearInterval(saveInterval);
    }, [onboardingData]);

  // Load saved draft on component mount
  React.useEffect(() => {
    const savedDraft = localStorage.getItem('onboardingDraft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setOnboardingData(parsedDraft);
      } catch (error) {
        console.error('Error loading saved draft:', error);
      }
    }
  }, []);

  // Inactivity tracker for draft email
  React.useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (onboardingData.currentStep > 1 && onboardingData.email && isValidEmail(onboardingData.email)) {
        inactivityTimer = setTimeout(() => {
          // Send draft email after 10 minutes of inactivity
        }, 600000); // 10 minutes of inactivity
      }
    };

    // Reset timer on any user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [onboardingData.currentStep, onboardingData.email]);



  const getProgressPercentage = (data: OnboardingData) => {
    const totalFields = 17; // Total number of required/important fields
    let completedFields = 0;
    
    // Company Information (4 fields)
    if (data.companyName?.trim()) completedFields++;
    if (data.industry?.trim()) completedFields++;
    if (data.website?.trim()) completedFields++;
    if (data.companyDescription?.trim()) completedFields++;
    
    // Contact Information (4 fields)
    if (data.contactName?.trim()) completedFields++;
    if (data.title?.trim()) completedFields++;
    if (data.email?.trim() && isValidEmail(data.email)) completedFields++;
    if (data.phone?.trim()) completedFields++;
    
    // Project Information (4 fields)
    if (data.projectGoals?.trim()) completedFields++;
    if (data.targetAudience?.trim()) completedFields++;
    if (data.audienceTags?.length > 0) completedFields++;
    if (data.keyFeatures?.length > 0) completedFields++;
    
    // Additional Information (5 fields)
    if (data.currentWebsite?.trim()) completedFields++;
    if (data.competitorWebsites?.some(site => site.trim())) completedFields++;
    if (data.brandingAssets !== undefined) completedFields++;
    if (data.contentReady !== undefined) completedFields++;
    if (data.additionalNotes?.trim()) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
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

  const handleAudienceTagToggle = (tag: string) => {
    setOnboardingData(prev => ({
      ...prev,
      audienceTags: prev.audienceTags.includes(tag)
        ? prev.audienceTags.filter(t => t !== tag)
        : [...prev.audienceTags, tag]
    }));
  };

  const addCompetitorWebsite = () => {
    setOnboardingData(prev => ({
      ...prev,
      competitorWebsites: [...prev.competitorWebsites, '']
    }));
  };

  const removeCompetitorWebsite = (index: number) => {
    setOnboardingData(prev => ({
      ...prev,
      competitorWebsites: prev.competitorWebsites.filter((_, i) => i !== index)
    }));
  };

  const updateCompetitorWebsite = (index: number, value: string) => {
    setOnboardingData(prev => ({
      ...prev,
      competitorWebsites: prev.competitorWebsites.map((site, i) => i === index ? value : site)
    }));
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }
    
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

  const handleFinalSubmit = async () => {
    try {
      console.log('Starting form submission...');
      setIsGeneratingSOW(true);
      
      // First, save the submission to the database
      console.log('Saving submission to database...');
      const { data: submission, error: submissionError } = await supabase
        .from('onboarding_submissions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Public submissions
          client_name: onboardingData.contactName,
          client_email: onboardingData.email,
          project_type: onboardingData.industry,
          industry: onboardingData.industry,
          budget_range: 'Not specified',
          timeline: 'Not specified',
          description: JSON.stringify(onboardingData),
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (submissionError) {
        console.error('Error submitting onboarding:', submissionError);
        alert('There was an error submitting your form. Please try again.');
        setIsGeneratingSOW(false);
        return;
      }

      console.log('Submission saved successfully:', submission);

      // Now generate the SOW using OpenAI
      console.log('Generating SOW...');
      const { data: generatedSOW, error: sowError } = await supabase.functions.invoke('generate-scope-of-work', {
        body: {
          clientData: {
            client_name: onboardingData.contactName,
            client_email: onboardingData.email,
            project_type: onboardingData.industry,
            description: `Company: ${onboardingData.companyName}\nIndustry: ${onboardingData.industry}\nProject Goals: ${onboardingData.projectGoals}\nTarget Audience: ${onboardingData.targetAudience}\nKey Features: ${onboardingData.keyFeatures.join(', ')}\nAdditional Notes: ${onboardingData.additionalNotes}`,
            timeline: 'To be discussed',
            budget_range: 'To be discussed',
            industry: onboardingData.industry
          }
        }
      });

      if (sowError) {
        console.error('Error generating SOW:', sowError);
        alert('There was an error generating your scope of work. Your submission was saved but the SOW could not be generated.');
        setIsGeneratingSOW(false);
        return;
      }

      console.log('SOW generated successfully:', generatedSOW);

      // Save the generated SOW to the scope_of_works table
      console.log('Saving SOW to database...');
      const { error: sowSaveError } = await supabase
        .from('scope_of_works')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Public submissions
          title: generatedSOW.title,
          content: generatedSOW.content,
          client: generatedSOW.client,
          client_contact: generatedSOW.client_contact,
          email: generatedSOW.email,
          industry: generatedSOW.industry,
          project_type: generatedSOW.project_type,
          status: generatedSOW.status,
          pages: generatedSOW.pages
        });

      if (sowSaveError) {
        console.error('Error saving generated SOW:', sowSaveError);
        alert('There was an error saving the generated SOW. Your submission was saved but the SOW could not be stored.');
      }

      console.log('Process completed successfully');

      // Clear saved draft
      localStorage.removeItem('onboardingDraft');
      
      setIsGeneratingSOW(false);
      setIsSubmitted(true);
      setShowSOW(false);
    } catch (error) {
      console.error('Error in handleFinalSubmit:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsGeneratingSOW(false);
    }
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
              Your onboarding form has been submitted and a custom scope of work has been generated using AI for your review.
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
                <Label htmlFor="companyName" className="text-sm font-medium mb-2 block">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={onboardingData.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry" className="text-sm font-medium mb-2 block">
                  Industry <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="companyDescription" className="text-sm font-medium mb-2 block">
                  Brief Company Description <span className="text-destructive">*</span>
                </Label>
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
                  <Label htmlFor="contactName" className="text-sm font-medium mb-2 block">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
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
                  <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
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
                  <div className="flex items-center">
                    <div className="flex items-center px-3 py-2 border border-r-0 rounded-l-md bg-muted text-sm whitespace-nowrap">
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
                      className="rounded-l-none flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="text-sm font-medium mb-2 block">Business Address</Label>
                <AddressAutocomplete
                  value={onboardingData.address}
                  onChange={(value) => updateData('address', value)}
                  placeholder="Start typing your business address..."
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
                <Label htmlFor="projectGoals" className="text-sm font-medium mb-2 block">
                  What are your main goals for this website? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="projectGoals"
                  placeholder="e.g., Increase online bookings, showcase our services, improve customer communication..."
                  value={onboardingData.projectGoals}
                  onChange={(e) => updateData('projectGoals', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="targetAudience" className="text-sm font-medium mb-2 block">
                  Who is your target audience? <span className="text-destructive">*</span>
                </Label>
                {onboardingData.industry && audienceTagsByIndustry[onboardingData.industry] && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-2">Quick select for {onboardingData.industry}:</p>
                    <div className="flex flex-wrap gap-2">
                      {audienceTagsByIndustry[onboardingData.industry].map((tag) => (
                        <Badge
                          key={tag}
                          variant={onboardingData.audienceTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleAudienceTagToggle(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Textarea
                  id="targetAudience"
                  placeholder="Describe your target audience or add to the selected tags above..."
                  value={onboardingData.targetAudience}
                  onChange={(e) => updateData('targetAudience', e.target.value)}
                  rows={3}
                />
                {onboardingData.audienceTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Selected audience tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {onboardingData.audienceTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Competitor websites you admire (optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCompetitorWebsite}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Website
                  </Button>
                </div>
                <div className="space-y-3">
                  {onboardingData.competitorWebsites.map((site, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://example.com - What you like about this site"
                        value={site}
                        onChange={(e) => updateCompetitorWebsite(index, e.target.value)}
                        className="flex-1"
                      />
                      {onboardingData.competitorWebsites.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCompetitorWebsite(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
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

              {onboardingData.brandingAssets && (
                <div className="w-full">
                  <Label className="text-sm font-medium mb-2 block">
                    Upload Branding Assets
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <UploadCloud01 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <div className="mb-2">
                      <Label htmlFor="brandingFiles" className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                        Choose files
                      </Label>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </div>
                    <Input
                      id="brandingFiles"
                      type="file"
                      multiple
                      accept=".svg,.eps,.ai,.pdf,.png,.jpg,.jpeg"
                      onChange={(e) => updateData('brandingFiles', e.target.files)}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      We prefer vector formats like SVG, EPS, AI, or PDF files when possible. 
                      You can also upload high-resolution PNG or JPG files.
                    </p>
                  </div>
                </div>
              )}

              {onboardingData.contentReady && (
                <div className="w-full">
                  <Label className="text-sm font-medium mb-2 block">
                    Upload Content Files
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <UploadCloud01 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <div className="mb-2">
                      <Label htmlFor="contentFiles" className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                        Choose files
                      </Label>
                      <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    </div>
                    <Input
                      id="contentFiles"
                      type="file"
                      multiple
                      accept=".doc,.docx,.pdf,.docm"
                      onChange={(e) => updateData('contentFiles', e.target.files)}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your content in DOC, DOCX, PDF, or DOCM format.
                      These will be used to populate your website with your text content.
                    </p>
                  </div>
                </div>
              )}
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

              <Button className="w-full px-8 py-3" size="lg" onClick={handleSubmit}>
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
              percentage={getProgressPercentage(onboardingData)} 
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
              className="px-8 py-3"
            >
              Previous
            </Button>
            <Button 
              onClick={nextStep} 
              disabled={onboardingData.currentStep === steps.length || !validateCurrentStep()}
              className="px-8 py-3"
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
                <Button variant="outline" onClick={() => setShowSOW(false)} className="px-8 py-3">
                  Request Changes
                </Button>
                <Button onClick={handleFinalSubmit} className="px-8 py-3">
                  Approve & Submit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loading Dialog for SOW Generation */}
      <Dialog open={isGeneratingSOW} onOpenChange={(open) => {
        // Prevent closing the dialog while generating
        if (!open && isGeneratingSOW) {
          return;
        }
      }}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              Generating Your Scope of Work
            </DialogTitle>
            <DialogDescription>
              Please wait while we create a custom scope of work based on your project details. This may take a few moments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✨ Analyzing your project requirements...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                🎯 Tailoring recommendations to your industry...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                📋 Creating your professional scope of work...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientOnboarding;