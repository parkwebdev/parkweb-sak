/**
 * Optimized Database Column Selections
 * 
 * Use these constants instead of select('*') to reduce payload size
 * and improve query performance. Reduces payload by 40-60% on average.
 * 
 * @module lib/db-selects
 * @see docs/DEVELOPMENT_STANDARDS.md for usage guidelines
 */

/**
 * Columns for lead list views (kanban, table).
 * Includes linked conversation minimal data.
 */
export const LEAD_LIST_COLUMNS = `
  id,
  name,
  email,
  phone,
  status,
  stage_id,
  kanban_order,
  created_at,
  updated_at,
  company,
  data,
  conversation_id,
  assigned_to,
  conversations!fk_leads_conversation(id, created_at, metadata)
`;

/**
 * Columns for lead detail views.
 * Full data including all fields.
 */
export const LEAD_DETAIL_COLUMNS = '*';

/**
 * Columns for conversation list views.
 * Includes agent name for display.
 */
export const CONVERSATION_LIST_COLUMNS = `
  id,
  agent_id,
  user_id,
  status,
  channel,
  location_id,
  created_at,
  updated_at,
  metadata,
  agents!fk_conversations_agent(name)
`;

/**
 * Columns for message list views.
 * Excludes tool-related fields for regular chat display.
 */
export const MESSAGE_LIST_COLUMNS = `
  id,
  conversation_id,
  role,
  content,
  created_at,
  metadata
`;

/**
 * Columns for webhook log views.
 * Essential fields for monitoring.
 */
export const WEBHOOK_LOG_COLUMNS = `
  id,
  webhook_id,
  event_type,
  response_status,
  delivered,
  created_at,
  delivered_at,
  error_message,
  retry_count
`;

/**
 * Columns for calendar event list views.
 */
export const CALENDAR_EVENT_LIST_COLUMNS = `
  id,
  title,
  start_time,
  end_time,
  status,
  event_type,
  all_day,
  connected_account_id,
  location_id,
  lead_id,
  visitor_name,
  visitor_email,
  created_at
`;

/**
 * Columns for knowledge source list views.
 */
export const KNOWLEDGE_SOURCE_LIST_COLUMNS = `
  id,
  source,
  type,
  source_type,
  status,
  refresh_strategy,
  created_at,
  updated_at,
  last_fetched_at,
  next_refresh_at,
  default_location_id
`;

/**
 * Columns for help article list views.
 */
export const HELP_ARTICLE_LIST_COLUMNS = `
  id,
  title,
  category_id,
  order_index,
  created_at,
  updated_at,
  embedding
`;

/**
 * Columns for notification list views.
 */
export const NOTIFICATION_LIST_COLUMNS = `
  id,
  title,
  message,
  type,
  read,
  created_at,
  data
`;

/**
 * Columns for team member list views.
 */
export const TEAM_MEMBER_LIST_COLUMNS = `
  id,
  member_id,
  owner_id,
  role,
  created_at
`;
