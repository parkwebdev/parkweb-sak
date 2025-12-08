/**
 * Webhook Type Definitions
 * 
 * Type-safe interfaces for webhook configurations and conditions.
 */

/** Condition rule for webhook triggers */
export interface WebhookConditionRule {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
}

/** Grouped conditions with logic operator */
export interface WebhookConditions {
  rules: WebhookConditionRule[];
  logic: 'AND' | 'OR';
}

/** Action to perform after webhook response */
export interface WebhookResponseAction {
  type: 'log' | 'transform' | 'notify' | 'store';
  config: Record<string, string>;
}

/** Supported authentication types for webhooks */
export type WebhookAuthType = 'none' | 'api_key' | 'bearer_token' | 'basic_auth';

/** Supported HTTP methods for webhooks */
export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Webhook update payload for onSave callbacks */
export interface WebhookUpdates {
  name?: string;
  url?: string;
  method?: WebhookMethod;
  events?: string[];
  active?: boolean;
  auth_type?: WebhookAuthType;
  auth_config?: Record<string, string>;
  headers?: Record<string, string>;
  conditions?: WebhookConditions;
  response_actions?: WebhookResponseAction[];
}

/** Full webhook configuration from database */
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: string;
  events: string[] | null;
  active: boolean | null;
  auth_type: string;
  auth_config: Record<string, string> | null;
  headers: Record<string, string> | null;
  conditions: WebhookConditions | null;
  response_actions: WebhookResponseAction[] | null;
  agent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}
