import { OnboardingData } from './OnboardingTypes';

// Auto-generated SOW content based on form data
export const generateScopeOfWork = (data: OnboardingData) => {
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