/**
 * Trigger Matcher
 * Matches incoming events against automation trigger configurations.
 * 
 * @module _shared/automation/trigger-matcher
 */

import type { Automation, TriggerEventConfig } from './types.ts';

export interface EventPayload {
  type: 'insert' | 'update' | 'delete';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

export interface MatchedAutomation {
  automation: Automation;
  triggerData: Record<string, unknown>;
}

/**
 * Map database table + operation to event types
 */
function getEventType(payload: EventPayload): string | null {
  const { table, type, record, old_record } = payload;

  if (table === 'leads') {
    if (type === 'insert') return 'lead.created';
    if (type === 'delete') return 'lead.deleted';
    if (type === 'update') {
      // Check for stage change
      if (old_record && record.stage_id !== old_record.stage_id) {
        return 'lead.stage_changed';
      }
      return 'lead.updated';
    }
  }

  if (table === 'conversations') {
    if (type === 'insert') return 'conversation.created';
    if (type === 'update') {
      // Check for status changes
      if (old_record) {
        if (record.status === 'closed' && old_record.status !== 'closed') {
          return 'conversation.closed';
        }
        if (record.status === 'human_takeover' && old_record.status !== 'human_takeover') {
          return 'conversation.human_takeover';
        }
      }
    }
  }

  if (table === 'messages') {
    if (type === 'insert' && record.role === 'user') {
      return 'message.received';
    }
  }

  if (table === 'calendar_events') {
    if (type === 'insert') return 'booking.created';
    if (type === 'delete') return 'booking.deleted';
    if (type === 'update') {
      // Check for status changes
      if (old_record) {
        if (record.status === 'cancelled' && old_record.status !== 'cancelled') {
          return 'booking.cancelled';
        }
        if (record.status === 'confirmed' && old_record.status !== 'confirmed') {
          return 'booking.confirmed';
        }
        if (record.status === 'completed' && old_record.status !== 'completed') {
          return 'booking.completed';
        }
        if (record.status === 'no_show' && old_record.status !== 'no_show') {
          return 'booking.no_show';
        }
      }
      return 'booking.updated';
    }
  }

  return null;
}

/**
 * Check if event matches automation's trigger filters
 */
function matchesFilters(
  triggerConfig: TriggerEventConfig,
  payload: EventPayload
): boolean {
  const filters = triggerConfig.filters;
  if (!filters || Object.keys(filters).length === 0) {
    return true; // No filters = match all
  }

  const record = payload.record;

  for (const [key, expectedValue] of Object.entries(filters)) {
    const actualValue = record[key];

    // Handle special filter operators
    if (typeof expectedValue === 'object' && expectedValue !== null) {
      const filterObj = expectedValue as Record<string, unknown>;
      
      // $eq - equals
      if ('$eq' in filterObj && actualValue !== filterObj.$eq) {
        return false;
      }
      
      // $ne - not equals
      if ('$ne' in filterObj && actualValue === filterObj.$ne) {
        return false;
      }
      
      // $in - in array
      if ('$in' in filterObj) {
        const arr = filterObj.$in as unknown[];
        if (!arr.includes(actualValue)) {
          return false;
        }
      }
      
      // $contains - string contains
      if ('$contains' in filterObj) {
        const str = String(actualValue || '');
        if (!str.includes(String(filterObj.$contains))) {
          return false;
        }
      }
      
      // $gt, $gte, $lt, $lte - numeric comparisons
      if ('$gt' in filterObj && !(Number(actualValue) > Number(filterObj.$gt))) {
        return false;
      }
      if ('$gte' in filterObj && !(Number(actualValue) >= Number(filterObj.$gte))) {
        return false;
      }
      if ('$lt' in filterObj && !(Number(actualValue) < Number(filterObj.$lt))) {
        return false;
      }
      if ('$lte' in filterObj && !(Number(actualValue) <= Number(filterObj.$lte))) {
        return false;
      }
    } else {
      // Simple equality check
      if (actualValue !== expectedValue) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Build trigger data from event payload
 */
function buildTriggerData(
  eventType: string,
  payload: EventPayload
): Record<string, unknown> {
  const { table, type, record, old_record } = payload;

  const triggerData: Record<string, unknown> = {
    event: eventType,
    table,
    operation: type,
    timestamp: new Date().toISOString(),
  };

  // Add record data based on table
  if (table === 'leads') {
    triggerData.lead = {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone,
      company: record.company,
      status: record.status,
      stage_id: record.stage_id,
      data: record.data,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    // For stage changes, include old stage
    if (eventType === 'lead.stage_changed' && old_record) {
      triggerData.previous_stage_id = old_record.stage_id;
    }
  }

  if (table === 'conversations') {
    triggerData.conversation = {
      id: record.id,
      agent_id: record.agent_id,
      status: record.status,
      channel: record.channel,
      metadata: record.metadata,
      created_at: record.created_at,
    };

    // Extract lead info from metadata if available
    const metadata = record.metadata as Record<string, unknown> | null;
    if (metadata?.lead_id) {
      triggerData.lead_id = metadata.lead_id;
    }
  }

  if (table === 'messages') {
    triggerData.message = {
      id: record.id,
      conversation_id: record.conversation_id,
      role: record.role,
      content: record.content,
      created_at: record.created_at,
    };
    triggerData.conversation_id = record.conversation_id;
  }

  if (table === 'calendar_events') {
    triggerData.booking = {
      id: record.id,
      title: record.title,
      start_time: record.start_time,
      end_time: record.end_time,
      status: record.status,
      event_type: record.event_type,
      visitor_name: record.visitor_name,
      visitor_email: record.visitor_email,
      visitor_phone: record.visitor_phone,
      lead_id: record.lead_id,
      conversation_id: record.conversation_id,
      location_id: record.location_id,
      notes: record.notes,
      created_at: record.created_at,
    };
    
    // Include lead_id and conversation_id at top level for easy access
    if (record.lead_id) {
      triggerData.lead_id = record.lead_id;
    }
    if (record.conversation_id) {
      triggerData.conversation_id = record.conversation_id;
    }
  }

  return triggerData;
}

/**
 * Find all automations that match the given event
 */
export function matchAutomations(
  automations: Automation[],
  payload: EventPayload
): MatchedAutomation[] {
  const eventType = getEventType(payload);
  
  if (!eventType) {
    return []; // Unrecognized event type
  }

  const matched: MatchedAutomation[] = [];

  for (const automation of automations) {
    // Only match event-triggered automations
    if (automation.trigger_type !== 'event') {
      continue;
    }

    // Must be enabled and active
    if (!automation.enabled || automation.status !== 'active') {
      continue;
    }

    const triggerConfig = automation.trigger_config as TriggerEventConfig;
    
    // Check if event type matches
    if (triggerConfig.event !== eventType) {
      continue;
    }

    // Check filters
    if (!matchesFilters(triggerConfig, payload)) {
      continue;
    }

    // Build trigger data for this automation
    const triggerData = buildTriggerData(eventType, payload);

    matched.push({
      automation,
      triggerData,
    });
  }

  return matched;
}

/**
 * Check if a schedule automation should run at the given time
 */
export function shouldRunSchedule(
  cronExpression: string,
  timezone: string,
  lastExecutedAt: string | null,
  now: Date = new Date()
): boolean {
  // Simple cron matching for common patterns
  // Format: minute hour day month weekday
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Convert to timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'numeric',
    weekday: 'short',
  });

  const formatted = formatter.formatToParts(now);
  const nowMinute = parseInt(formatted.find(p => p.type === 'minute')?.value || '0');
  const nowHour = parseInt(formatted.find(p => p.type === 'hour')?.value || '0');
  const nowDay = parseInt(formatted.find(p => p.type === 'day')?.value || '0');
  const nowMonth = parseInt(formatted.find(p => p.type === 'month')?.value || '0');
  const nowWeekday = formatted.find(p => p.type === 'weekday')?.value || '';

  // Map weekday names to numbers (0 = Sunday)
  const weekdayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  const nowWeekdayNum = weekdayMap[nowWeekday] ?? 0;

  // Check each field
  if (!matchesCronField(minute, nowMinute)) return false;
  if (!matchesCronField(hour, nowHour)) return false;
  if (!matchesCronField(dayOfMonth, nowDay)) return false;
  if (!matchesCronField(month, nowMonth)) return false;
  if (!matchesCronField(dayOfWeek, nowWeekdayNum)) return false;

  // Prevent running more than once per minute
  if (lastExecutedAt) {
    const lastRun = new Date(lastExecutedAt);
    const diffMs = now.getTime() - lastRun.getTime();
    if (diffMs < 60000) {
      return false;
    }
  }

  return true;
}

function matchesCronField(field: string, value: number): boolean {
  if (field === '*') return true;
  
  // Handle */n (every n)
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2));
    return value % step === 0;
  }
  
  // Handle ranges (e.g., 1-5)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    return value >= start && value <= end;
  }
  
  // Handle lists (e.g., 1,3,5)
  if (field.includes(',')) {
    const values = field.split(',').map(Number);
    return values.includes(value);
  }
  
  // Direct match
  return parseInt(field) === value;
}
