import React from 'react';

export const steps = [
  { id: 1, title: 'Welcome', description: 'Getting started' },
  { id: 2, title: 'Company Info', description: 'Tell us about your business' },
  { id: 3, title: 'Contact Details', description: 'Your contact information' },
  { id: 4, title: 'Project Goals', description: 'What you want to achieve' },
  { id: 5, title: 'Features', description: 'Project specifications' },
  { id: 6, title: 'Additional Info', description: 'Final details' },
  { id: 7, title: 'Review & Submit', description: 'Confirm your information' }
];

export const industryOptions = [
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

export const featureOptions = [
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

export const audienceTagsByIndustry = {
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