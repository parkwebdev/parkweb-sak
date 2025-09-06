import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, Building2, User, Mail, Phone, MapPin, Globe, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface OnboardingData {
  // Company Information
  companyName: string;
  industry: string;
  companySize: string;
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
  timeline: string;
  budget: string;
  
  // Additional Information
  currentWebsite: string;
  competitorSites: string;
  brandingAssets: boolean;
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
  { id: 5, title: 'Features & Timeline', description: 'Project specifications' },
  { id: 6, title: 'Additional Info', description: 'Final details' },
  { id: 7, title: 'Review & Submit', description: 'Confirm your information' }
];

const ClientOnboarding = () => {
  const [searchParams] = useSearchParams();
  const clientName = searchParams.get('name') || 'Valued Client';
  const companyName = searchParams.get('company') || 'Your Company';

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyName: companyName,
    industry: '',
    companySize: '',
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
    timeline: '',
    budget: '',
    currentWebsite: '',
    competitorSites: '',
    brandingAssets: false,
    contentReady: false,
    additionalNotes: '',
    currentStep: 1
  });

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

  const renderStepContent = () => {
    switch (onboardingData.currentStep) {
      case 1:
        return (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
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
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>7 simple steps to complete</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Takes about 10-15 minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Your progress is automatically saved</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>We'll follow up within 24 hours</span>
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
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tell us about {companyName}
              </CardTitle>
              <CardDescription>
                Help us understand your business so we can create a website that perfectly represents your brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={onboardingData.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select value={onboardingData.industry} onValueChange={(value) => updateData('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={onboardingData.companySize} onValueChange={(value) => updateData('companySize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Current Website (if any)</Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={onboardingData.website}
                  onChange={(e) => updateData('website', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyDescription">Brief Company Description *</Label>
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
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                We'll use this information to keep you updated on your project's progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={onboardingData.contactName}
                    onChange={(e) => updateData('contactName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Job Title</Label>
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
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={onboardingData.email}
                    onChange={(e) => updateData('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={onboardingData.phone}
                    onChange={(e) => updateData('phone', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Business Address</Label>
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
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Project Goals & Audience
              </CardTitle>
              <CardDescription>
                Help us understand what you want to achieve with your new website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectGoals">What are your main goals for this website? *</Label>
                <Textarea
                  id="projectGoals"
                  placeholder="e.g., Increase online bookings, showcase our services, improve customer communication..."
                  value={onboardingData.projectGoals}
                  onChange={(e) => updateData('projectGoals', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="targetAudience">Who is your target audience? *</Label>
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
                <Label className="text-base font-medium">Which features would you like? (Select all that apply)</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeline">Preferred Timeline</Label>
                  <Select value={onboardingData.timeline} onValueChange={(value) => updateData('timeline', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">ASAP</SelectItem>
                      <SelectItem value="1-month">Within 1 month</SelectItem>
                      <SelectItem value="2-3-months">2-3 months</SelectItem>
                      <SelectItem value="3-6-months">3-6 months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select value={onboardingData.budget} onValueChange={(value) => updateData('budget', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-5k">Under $5,000</SelectItem>
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="competitorSites">Competitor websites you admire (optional)</Label>
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
                <Label htmlFor="additionalNotes">Additional notes or questions</Label>
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
                Please review your information before submitting. We'll be in touch soon!
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
                  <strong>Timeline:</strong> {onboardingData.timeline}
                </div>
                <div>
                  <strong>Selected Features:</strong> {onboardingData.keyFeatures.length} features selected
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• We'll review your information within 24 hours</li>
                  <li>• Our team will prepare a detailed proposal</li>
                  <li>• We'll schedule a call to discuss your project</li>
                  <li>• Once approved, we'll begin the design process</li>
                </ul>
              </div>

              <Button className="w-full" size="lg">
                Submit Onboarding Form
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                  step.id === onboardingData.currentStep 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : step.id < onboardingData.currentStep 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : 'border-border bg-background text-muted-foreground'
                }`}>
                  {step.id < onboardingData.currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-2 ${
                    step.id < onboardingData.currentStep ? 'bg-green-500' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {steps[onboardingData.currentStep - 1]?.title}
            </h2>
            <p className="text-muted-foreground">
              Step {onboardingData.currentStep} of {steps.length}
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
            disabled={onboardingData.currentStep === 1}
          >
            Previous
          </Button>
          <Button 
            onClick={nextStep} 
            disabled={onboardingData.currentStep === steps.length}
            className="flex items-center gap-2"
          >
            {onboardingData.currentStep === steps.length ? 'Complete' : 'Next Step'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;