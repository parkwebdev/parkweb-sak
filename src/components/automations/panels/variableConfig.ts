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
    ],
  },
  conversation: {
    label: 'Conversation',
    variables: [
      { path: 'conversation.id', description: 'Conversation ID' },
      { path: 'conversation.channel', description: 'Channel (widget, api)' },
      { path: 'conversation.status', description: 'Status' },
      { path: 'conversation.created_at', description: 'Created timestamp' },
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
