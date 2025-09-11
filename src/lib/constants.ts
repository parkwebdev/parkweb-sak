// Application constants and shared configuration

export const APP_CONFIG = {
  name: 'Agency Dashboard',
  version: '1.0.0',
  defaultTheme: 'dark' as const,
} as const;

export const ROUTES = {
  home: '/',
  onboarding: '/onboarding',
  clientOnboarding: '/client-onboarding',
  scopeOfWorks: '/scope-of-works',
  clients: '/clients',
  team: '/team',
  profile: '/profile',
  settings: '/settings',
} as const;

export const INDUSTRY_OPTIONS = [
  { value: 'rv-park', label: 'RV Park/Resort' },
  { value: 'manufactured-home', label: 'Manufactured Home Community' },
  { value: 'local-business', label: 'Local Business' },
  { value: 'national-business', label: 'National Business' },
  { value: 'capital-syndication', label: 'Capital & Syndication' },
  { value: 'other', label: 'Other' },
] as const;

export const STATUS_OPTIONS = {
  onboarding: ['Sent', 'In Progress', 'Completed', 'SOW Generated', 'Approved'],
  project: ['Complete', 'Incomplete', 'In Review'],
} as const;

export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
} as const;

export const REQUEST_STATUSES = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed'
} as const;

export const REQUEST_PRIORITIES = {
  low: 'Low',
  medium: 'Medium', 
  high: 'High',
  urgent: 'Urgent'
} as const;