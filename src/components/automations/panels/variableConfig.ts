/**
 * Variable Configuration
 * 
 * Centralized variable definitions for automation nodes.
 * 
 * @module components/automations/panels/variableConfig
 */

export interface Variable {
  path: string;
  description: string;
}

export interface VariableCategory {
  label: string;
  variables: Variable[];
}

export const VARIABLE_CATEGORIES: Record<string, VariableCategory> = {
  lead: {
    label: 'Lead',
    variables: [
      { path: 'lead.id', description: 'Lead ID' },
      { path: 'lead.name', description: 'Full name' },
      { path: 'lead.email', description: 'Email address' },
      { path: 'lead.phone', description: 'Phone number' },
      { path: 'lead.company', description: 'Company name' },
      { path: 'lead.status', description: 'Lead status' },
      { path: 'lead.stage_id', description: 'Pipeline stage ID' },
      { path: 'lead.data.priority', description: 'Lead priority' },
      { path: 'lead.data.notes', description: 'Lead notes' },
    ],
  },
  conversation: {
    label: 'Conversation',
    variables: [
      { path: 'conversation.id', description: 'Conversation ID' },
      { path: 'conversation.channel', description: 'Channel (widget, api)' },
      { path: 'conversation.status', description: 'Status' },
      { path: 'conversation.created_at', description: 'Created timestamp' },
      { path: 'conversation.last_message', description: 'Last message content' },
      { path: 'conversation.messages', description: 'All messages' },
    ],
  },
  trigger: {
    label: 'Trigger',
    variables: [
      { path: 'trigger.event', description: 'Event that triggered' },
      { path: 'trigger.timestamp', description: 'When it triggered' },
      { path: 'trigger.data', description: 'Raw trigger data' },
    ],
  },
  environment: {
    label: 'Environment',
    variables: [
      { path: 'env.timestamp', description: 'Current timestamp' },
      { path: 'env.execution_id', description: 'Execution ID' },
      { path: 'env.automation_id', description: 'Automation ID' },
    ],
  },
};

/**
 * Human-readable labels for variable paths
 * Used to display friendly names instead of technical paths
 */
export const HUMAN_READABLE_VARIABLES: Record<string, string> = {
  'lead.id': 'Lead ID',
  'lead.name': "Lead's name",
  'lead.email': "Lead's email",
  'lead.phone': "Lead's phone",
  'lead.company': "Lead's company",
  'lead.status': "Lead's status",
  'lead.stage_id': "Lead's stage",
  'lead.data.priority': "Lead's priority",
  'lead.data.notes': "Lead's notes",
  'conversation.id': 'Conversation ID',
  'conversation.channel': 'Conversation channel',
  'conversation.status': 'Conversation status',
  'conversation.created_at': 'Conversation start time',
  'conversation.last_message': 'Last message',
  'conversation.messages': 'Full conversation',
  'trigger.event': 'Trigger event',
  'trigger.timestamp': 'Trigger time',
  'trigger.data': 'Trigger data',
  'env.timestamp': 'Current time',
  'env.execution_id': 'Execution ID',
  'env.automation_id': 'Automation ID',
};

export type VariableCategoryKey = keyof typeof VARIABLE_CATEGORIES;

/**
 * Get variables for specified categories
 */
export function getVariablesForCategories(
  categories: VariableCategoryKey[]
): { category: string; label: string; variables: Variable[] }[] {
  return categories
    .filter((key) => VARIABLE_CATEGORIES[key])
    .map((key) => ({
      category: key,
      label: VARIABLE_CATEGORIES[key].label,
      variables: VARIABLE_CATEGORIES[key].variables,
    }));
}
