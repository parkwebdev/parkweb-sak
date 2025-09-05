import React, { useState } from 'react';
import { FileText, Building2, Home, Factory, Briefcase, TrendingUp } from 'lucide-react';

interface SoWFormData {
  clientName: string;
  projectType: string;
  industry: string;
  goals: string;
}

interface IndustryModule {
  name: string;
  icon: React.ComponentType<any>;
  pages: string[];
  integrations: string[];
  ctaTypes: string[];
}

const industryModules: Record<string, IndustryModule> = {
  'rv-parks': {
    name: 'RV Parks / Manufactured Home Communities',
    icon: Home,
    pages: ['Facilities & Amenities', 'Rates (RV, lot rent, homes)', 'Park Map', 'Things To Do', 'Homes for Sale / Rent', 'Resident Portal', 'FAQ', 'Announcements'],
    integrations: ['Booking Engine', 'Payment Processing', 'Resident Portal', 'Google Maps'],
    ctaTypes: ['Book Now', 'Apply Now', 'Schedule Tour']
  },
  'local-business': {
    name: 'Local Businesses (Service-Based)',
    icon: Building2,
    pages: ['Services / Products', 'Testimonials / Reviews', 'Portfolio / Case Studies', 'FAQ'],
    integrations: ['Appointment Scheduling', 'Quote Request System', 'Google Maps', 'Review Integration'],
    ctaTypes: ['Book Appointment', 'Get Quote', 'Contact Us']
  },
  'national-business': {
    name: 'National Businesses',
    icon: Factory,
    pages: ['Services / Solutions', 'Industries Served', 'Locations Page / Locator', 'Resources', 'Careers'],
    integrations: ['CRM Integration', 'Location Finder', 'Resource Portal', 'Career Portal'],
    ctaTypes: ['Get Started', 'Request Demo', 'Contact Sales']
  },
  'capital-syndication': {
    name: 'Capital & Syndication Companies',
    icon: TrendingUp,
    pages: ['Investor Relations / Portal', 'Portfolio / Past Deals', 'Team & Leadership Bios', 'How It Works', 'Legal/Compliance Pages'],
    integrations: ['Investor Portal', 'Document Management', 'CRM', 'Compliance Tools'],
    ctaTypes: ['Invest Now', 'Learn More', 'Schedule Consultation']
  }
};

const universalPages = [
  'Home Page',
  'About Us',
  'Contact',
  'Privacy Policy',
  'Terms of Service'
];

export const SoWGenerator: React.FC = () => {
  const [formData, setFormData] = useState<SoWFormData>({
    clientName: '',
    projectType: 'Web Design',
    industry: '',
    goals: ''
  });
  
  const [generatedSoW, setGeneratedSoW] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof SoWFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSoW = async () => {
    if (!formData.clientName || !formData.industry) return;
    
    setIsGenerating(true);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const industry = industryModules[formData.industry];
    const allPages = [...universalPages, ...industry.pages];
    
    const sowContent = `
# SCOPE OF WORK
## Website Design & Development

**Client:** ${formData.clientName}
**Project Type:** ${formData.projectType}
**Industry:** ${industry.name}
**Date:** ${new Date().toLocaleDateString()}

---

## PROJECT OVERVIEW

**Goals:** ${formData.goals || 'Create a professional, conversion-focused website that effectively communicates value and drives business growth.'}

**Target Audience:** Primary customers and stakeholders in the ${industry.name.toLowerCase()} industry.

---

## WEBSITE STRUCTURE (SITE MAP)

### Core Pages (Universal)
${universalPages.map(page => `• ${page}`).join('\n')}

### Industry-Specific Pages
${industry.pages.map(page => `• ${page}`).join('\n')}

---

## PAGE CONTENT OUTLINES

### Home Page
**Hero Section:**
• Compelling headline and subheadline
• High-quality hero image/video
• Primary call-to-action button
• Trust indicators (awards, testimonials, etc.)

**Content Blocks:**
• Value proposition section
• Key services/offerings overview
• Social proof (testimonials, logos, stats)
• Secondary call-to-action

**Footer CTA:**
• Final conversion opportunity
• Contact information
• Newsletter signup

### About Page
• Company story and mission
• Team photos and bios
• Company values and culture
• Trust building elements

### Services/Solutions Pages
• Detailed service descriptions
• Benefits and features
• Process explanation
• Pricing information (if applicable)
• Service-specific CTAs

---

## MEDIA & BRANDING ASSETS

### Required from Client:
• **Logo:** High-resolution files (SVG preferred)
• **Photos:** Professional images of facilities, team, products
• **Videos:** Optional but recommended for engagement
• **Brand Guidelines:** Colors, fonts, style preferences
• **Copy Content:** All written content for pages
• **Legal Documents:** Privacy policy, terms of service

### We Will Provide:
• Custom graphic design elements
• Icon selection and implementation
• Image optimization and formatting
• Layout and visual hierarchy design

---

## FUNCTIONALITY & INTEGRATIONS

### Technical Features:
${industry.integrations.map(integration => `• ${integration}`).join('\n')}
• Responsive design (desktop, tablet, mobile)
• SEO optimization (meta tags, alt text, structured data)
• Contact forms with spam protection
• Google Analytics integration
• Site search functionality

### Performance:
• Fast loading times (<3 seconds)
• Mobile-optimized experience
• Cross-browser compatibility
• SSL certificate installation

---

## CALLS-TO-ACTION (CTAs)

### Primary CTAs:
${industry.ctaTypes.map(cta => `• ${cta}`).join('\n')}

### Secondary CTAs:
• Newsletter signup
• Resource downloads
• Social media follows
• Contact for more information

### CTA Placement:
• Hero section (above the fold)
• End of each main page section
• Footer on every page
• Strategic placement throughout content

---

## DELIVERABLES & RESPONSIBILITIES

### Agency Deliverables:
• Complete website design and development
• Responsive design implementation
• Content formatting and optimization
• Basic SEO setup
• Integration setup and testing
• 1 month of post-launch support
• Training documentation

### Client Responsibilities:
• Provide all written content
• Supply high-quality images and media
• Review and approve design concepts
• Provide feedback within agreed timeframes
• Supply integration credentials (booking systems, etc.)
• Final content review and approval

---

## PROJECT TIMELINE

**Phase 1: Discovery & Planning** (Week 1)
• Requirements gathering
• Content audit
• Technical specifications

**Phase 2: Design** (Weeks 2-3)
• Wireframes and mockups
• Design revisions
• Final design approval

**Phase 3: Development** (Weeks 4-5)
• Website build
• Integration setup
• Content population

**Phase 4: Testing & Launch** (Week 6)
• Quality assurance testing
• Client review and approval
• Website launch

---

## NEXT STEPS

1. **Content Collection:** Client provides all written content and media assets
2. **Design Kickoff:** Schedule design review meeting
3. **Development:** Begin website build upon design approval
4. **Launch:** Deploy website and begin post-launch support

---

*This scope of work serves as both a client-facing outline and internal development roadmap to ensure project success and prevent scope creep.*
    `;
    
    setGeneratedSoW(sowContent);
    setIsGenerating(false);
  };

  const downloadSoW = () => {
    if (!generatedSoW) return;
    
    const blob = new Blob([generatedSoW], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.clientName.replace(/\s+/g, '_')}_SoW.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none">
      {!generatedSoW ? (
        <div className="border shadow-sm w-full bg-card rounded-xl border-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText size={24} className="text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Scope of Work Generator</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Enter client name"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Type
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => handleInputChange('projectType', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Web Design">Web Design</option>
                  <option value="Branding + Web">Branding + Web</option>
                  <option value="Web Redesign">Web Redesign</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Industry Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(industryModules).map(([key, industry]) => {
                  const IconComponent = industry.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleInputChange('industry', key)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        formData.industry === key
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={20} />
                        <span className="font-medium">{industry.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Project Goals (Optional)
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="Describe what this website should achieve for the client..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={generateSoW}
              disabled={!formData.clientName || !formData.industry || isGenerating}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating Scope of Work...' : 'Generate Scope of Work'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Generated Scope of Work</h2>
            <div className="flex gap-3">
              <button
                onClick={downloadSoW}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Download SoW
              </button>
              <button
                onClick={() => {
                  setGeneratedSoW(null);
                  setFormData({ clientName: '', projectType: 'Web Design', industry: '', goals: '' });
                }}
                className="px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Create New SoW
              </button>
            </div>
          </div>
          
          <div className="border shadow-sm bg-card rounded-xl border-border p-8">
            <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">
              {generatedSoW}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};