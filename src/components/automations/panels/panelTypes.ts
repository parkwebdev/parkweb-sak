/**
 * Panel Types and Human-Readable Configuration
 * 
 * Shared types and human-readable mappings for automation config panels.
 * Provides dummy-proof defaults and simplified user experience.
 * 
 * @module components/automations/panels/panelTypes
 */

/**
 * Human-readable input source for dropdowns
 */
export interface InputSourceOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Smart input sources with human-readable labels
 * Used in AI nodes instead of raw variable paths
 */
export const INPUT_SOURCES: InputSourceOption[] = [
  { 
    value: '{{conversation.last_message}}', 
    label: 'Last message in conversation',
    description: 'The most recent message from the lead'
  },
  { 
    value: '{{conversation.messages}}', 
    label: 'Full conversation history',
    description: 'All messages in the current conversation'
  },
  { 
    value: '{{lead.name}}', 
    label: "Lead's name",
    description: 'The full name of the lead'
  },
  { 
    value: '{{lead.email}}', 
    label: "Lead's email address",
    description: 'Email address of the lead'
  },
  { 
    value: '{{lead.company}}', 
    label: "Lead's company",
    description: 'Company name of the lead'
  },
  { 
    value: '{{trigger.data}}', 
    label: 'Trigger data',
    description: 'Raw data from the trigger event'
  },
];

/**
 * Email recipient options - simplified for dummy-proof UX
 */
export const EMAIL_RECIPIENT_OPTIONS: InputSourceOption[] = [
  { 
    value: '{{lead.email}}', 
    label: "Lead's email address",
    description: 'Send to the email address of the triggered lead'
  },
];

/**
 * Lead status options for dropdowns
 */
export const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
] as const;

/**
 * Human-readable condition fields for Logic Condition node
 */
export const CONDITION_FIELD_OPTIONS: InputSourceOption[] = [
  { value: '{{lead.name}}', label: "Lead's name" },
  { value: '{{lead.email}}', label: "Lead's email" },
  { value: '{{lead.status}}', label: "Lead's status" },
  { value: '{{lead.stage_id}}', label: "Lead's stage" },
  { value: '{{lead.company}}', label: "Lead's company" },
  { value: '{{lead.phone}}', label: "Lead's phone" },
  { value: '{{lead.data.priority}}', label: "Lead's priority" },
  { value: '{{conversation.channel}}', label: 'Conversation channel' },
  { value: '{{conversation.status}}', label: 'Conversation status' },
  { value: '{{trigger.event}}', label: 'Trigger event type' },
];

/**
 * Category presets for AI Classify node
 */
export const CATEGORY_PRESETS = {
  sentiment: [
    { name: 'Positive', description: 'Happy, satisfied, enthusiastic' },
    { name: 'Neutral', description: 'Neither positive nor negative' },
    { name: 'Negative', description: 'Unhappy, frustrated, angry' },
  ],
  intent: [
    { name: 'Purchase', description: 'Looking to buy or subscribe' },
    { name: 'Support', description: 'Needs help or has an issue' },
    { name: 'Information', description: 'Seeking information' },
    { name: 'Complaint', description: 'Has a complaint or concern' },
  ],
  urgency: [
    { name: 'Urgent', description: 'Needs immediate attention' },
    { name: 'Normal', description: 'Standard priority' },
    { name: 'Low', description: 'Can wait or not time-sensitive' },
  ],
} as const;

/**
 * Prompt templates for AI Generate node
 */
export const PROMPT_TEMPLATES = [
  {
    label: 'Summarize conversation',
    prompt: 'Summarize the following conversation between the lead and our agent. Focus on the key points, questions asked, and any action items:\n\n{{conversation.messages}}',
  },
  {
    label: 'Draft follow-up email',
    prompt: 'Based on this conversation, draft a professional follow-up email to {{lead.name}}:\n\n{{conversation.messages}}\n\nThe email should be friendly, address their questions, and include a clear call-to-action.',
  },
  {
    label: 'Extract key information',
    prompt: 'Extract and summarize the key information from this conversation. Include: main topic, questions asked, concerns raised, and next steps:\n\n{{conversation.messages}}',
  },
  {
    label: 'Classify lead intent',
    prompt: 'Analyze the following conversation and classify the lead\'s primary intent. What are they looking for? What problem are they trying to solve?\n\n{{conversation.messages}}',
  },
] as const;

/**
 * Fields that require special dropdown inputs based on their type
 */
export const CONTEXT_AWARE_FIELDS = {
  status: 'LEAD_STATUS',
  stage_id: 'LEAD_STAGE',
  'data.priority': 'PRIORITY',
} as const;

export type ContextAwareFieldType = typeof CONTEXT_AWARE_FIELDS[keyof typeof CONTEXT_AWARE_FIELDS];
