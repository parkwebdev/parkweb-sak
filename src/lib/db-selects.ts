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

/**
 * Columns for announcement list views.
 */
export const ANNOUNCEMENT_LIST_COLUMNS = `
  id,
  agent_id,
  title,
  subtitle,
  image_url,
  action_type,
  action_url,
  background_color,
  title_color,
  is_active,
  order_index,
  created_at,
  updated_at,
  user_id
`;

/**
 * Columns for agent API key list views.
 */
export const AGENT_API_KEY_COLUMNS = `
  id,
  agent_id,
  key_prefix,
  name,
  requests_per_minute,
  requests_per_day,
  current_minute_requests,
  current_day_requests,
  last_used_at,
  created_at,
  revoked_at
`;

/**
 * Columns for lead stage list views.
 */
export const LEAD_STAGE_COLUMNS = `
  id,
  user_id,
  name,
  color,
  order_index,
  is_default,
  created_at,
  updated_at
`;

/**
 * Columns for lead activity list views.
 */
export const LEAD_ACTIVITY_COLUMNS = `
  id,
  lead_id,
  action_type,
  action_data,
  user_id,
  created_at
`;

/**
 * Columns for lead comment list views.
 */
export const LEAD_COMMENT_COLUMNS = `
  id,
  lead_id,
  user_id,
  content,
  created_at,
  updated_at
`;

/**
 * Columns for lead assignee list views.
 */
export const LEAD_ASSIGNEE_COLUMNS = `
  id,
  lead_id,
  user_id,
  assigned_at,
  assigned_by
`;

/**
 * Columns for news item list views.
 */
export const NEWS_ITEM_COLUMNS = `
  id,
  agent_id,
  user_id,
  title,
  body,
  featured_image_url,
  author_name,
  author_avatar,
  cta_primary_label,
  cta_primary_url,
  cta_secondary_label,
  cta_secondary_url,
  is_published,
  published_at,
  order_index,
  created_at,
  updated_at
`;

/**
 * Columns for location list views.
 */
export const LOCATION_COLUMNS = `
  id,
  agent_id,
  user_id,
  name,
  address,
  city,
  state,
  zip,
  country,
  phone,
  email,
  timezone,
  business_hours,
  is_active,
  wordpress_slug,
  created_at,
  updated_at
`;

/**
 * Columns for help category list views.
 */
export const HELP_CATEGORY_COLUMNS = `
  id,
  agent_id,
  name,
  description,
  icon,
  order_index,
  created_at
`;

/**
 * Columns for scheduled report list views.
 */
export const SCHEDULED_REPORT_COLUMNS = `
  id,
  user_id,
  name,
  frequency,
  day_of_week,
  day_of_month,
  time_of_day,
  timezone,
  recipients,
  report_config,
  active,
  last_sent_at,
  created_at,
  created_by
`;

/**
 * Columns for profile list views.
 */
export const PROFILE_LIST_COLUMNS = `
  id,
  user_id,
  display_name,
  avatar_url,
  email,
  created_at
`;

/**
 * Columns for report export list views.
 */
export const REPORT_EXPORT_COLUMNS = `
  id,
  user_id,
  agent_id,
  name,
  format,
  file_path,
  file_size,
  date_range_start,
  date_range_end,
  report_config,
  created_at,
  created_by
`;

/**
 * Columns for property list views.
 */
export const PROPERTY_LIST_COLUMNS = `
  id,
  agent_id,
  knowledge_source_id,
  location_id,
  external_id,
  lot_number,
  address,
  city,
  state,
  zip,
  beds,
  baths,
  sqft,
  price,
  price_type,
  status,
  description,
  features,
  images,
  listing_url,
  year_built,
  first_seen_at,
  last_seen_at,
  created_at,
  updated_at
`;

/**
 * Columns for webhook list views.
 */
export const WEBHOOK_COLUMNS = `
  id,
  agent_id,
  user_id,
  name,
  url,
  method,
  events,
  headers,
  auth_type,
  auth_config,
  conditions,
  response_actions,
  active,
  created_at,
  updated_at
`;

/**
 * Columns for KB article popularity views.
 */
export const KB_ARTICLE_POPULARITY_COLUMNS = `
  article_slug,
  category_id,
  view_count,
  unique_views
`;

/**
 * Columns for agent views.
 * Core agent data without large JSONB fields.
 */
export const AGENT_COLUMNS = `
  id,
  user_id,
  name,
  description,
  model,
  status,
  temperature,
  max_tokens,
  system_prompt,
  deployment_config,
  enable_news_tab,
  has_viewed_installation,
  created_at,
  updated_at
`;

/**
 * Columns for conversation views (used in search).
 */
export const CONVERSATION_SEARCH_COLUMNS = `
  id,
  agent_id,
  status,
  channel,
  created_at,
  updated_at,
  metadata,
  agents!fk_conversations_agent(name)
`;

/**
 * Columns for lead search views.
 */
export const LEAD_SEARCH_COLUMNS = `
  id,
  name,
  email,
  phone,
  company,
  status,
  created_at
`;

/**
 * Columns for automation list views.
 * Excludes nodes/edges for performance.
 */
export const AUTOMATION_LIST_COLUMNS = `
  id,
  agent_id,
  user_id,
  name,
  description,
  icon,
  color,
  status,
  enabled,
  trigger_type,
  trigger_config,
  execution_count,
  last_executed_at,
  last_execution_status,
  created_at,
  updated_at
`;

/**
 * Columns for automation detail views.
 * Includes full flow definition.
 */
export const AUTOMATION_DETAIL_COLUMNS = `
  id,
  agent_id,
  user_id,
  name,
  description,
  icon,
  color,
  status,
  enabled,
  trigger_type,
  trigger_config,
  nodes,
  edges,
  viewport,
  execution_count,
  last_executed_at,
  last_execution_status,
  created_at,
  updated_at
`;

/**
 * Columns for automation execution list views.
 */
export const AUTOMATION_EXECUTION_LIST_COLUMNS = `
  id,
  automation_id,
  trigger_type,
  trigger_data,
  status,
  error,
  error_node_id,
  started_at,
  completed_at,
  duration_ms,
  test_mode,
  triggered_by,
  lead_id,
  conversation_id
`;

/**
 * Columns for automation execution detail views.
 * Includes full execution data.
 */
export const AUTOMATION_EXECUTION_DETAIL_COLUMNS = `
  id,
  automation_id,
  trigger_type,
  trigger_data,
  status,
  nodes_executed,
  variables,
  error,
  error_node_id,
  started_at,
  completed_at,
  duration_ms,
  test_mode,
  triggered_by,
  lead_id,
  conversation_id
`;
