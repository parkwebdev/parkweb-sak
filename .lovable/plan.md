
# Plan: Address Enterprise Security Gaps

## Overview

This plan addresses three categories of enterprise security gaps identified in the codebase:

1. **Untyped catch blocks** (5 files) - MEDIUM severity
2. **`select('*')` usage** (22+ files) - MEDIUM severity  
3. **Overly permissive RLS policies** (9 policies) - HIGH severity

The OAuth token encryption (Item 6) is blocked by Supabase Dashboard requirements and already documented in `docs/SECURITY.md` with manual setup instructions.

---

## Part 1: Fix Untyped Catch Blocks

### Files to Update

| File | Line | Current | Fix |
|------|------|---------|-----|
| `supabase/functions/admin-update-plan/index.ts` | 177 | `catch (error)` | `catch (error: unknown)` |
| `supabase/functions/send-push-notification/index.ts` | 401 | `catch (error)` | `catch (error: unknown)` |
| `supabase/functions/send-push-notification/index.ts` | 498 | `catch (error)` | `catch (error: unknown)` |
| `src/hooks/useServiceWorker.ts` | 88 | `catch (error)` | `catch (error: unknown)` |
| `src/sw.ts` | 38 | `catch (error)` | `catch (error: unknown)` |

### Implementation Pattern

All catch blocks will use the shared `getErrorMessage()` utility:

```typescript
// Edge functions - use _shared/errors.ts
import { getErrorMessage } from '../_shared/errors.ts';

try {
  // ...
} catch (error: unknown) {
  console.error('Error:', getErrorMessage(error));
}

// Frontend - use src/types/errors.ts
import { getErrorMessage } from '@/types/errors';

try {
  // ...
} catch (error: unknown) {
  logger.error('Error:', getErrorMessage(error));
}
```

---

## Part 2: Replace `select('*')` with Optimized Column Constants

### Priority 1: Frontend Hooks (User-facing, high traffic)

| File | Table | New Constant |
|------|-------|--------------|
| `src/hooks/useLocations.ts` | locations | `LOCATION_COLUMNS` |
| `src/hooks/useProperties.ts` | properties | `PROPERTY_LIST_COLUMNS` |
| `src/components/settings/ProfileSettings.tsx` | profiles | `PROFILE_LIST_COLUMNS` |
| `src/components/settings/NotificationSettings.tsx` | notification_preferences | Create `NOTIFICATION_PREFS_COLUMNS` |
| `src/hooks/admin/usePlatformHCCategories.ts` | platform_hc_categories | `PLATFORM_HC_CATEGORY_COLUMNS` |
| `src/hooks/admin/useRelatedAuditActivity.ts` | admin_audit_log | Create `AUDIT_LOG_COLUMNS` |

### Priority 2: Edge Functions (Server-side, still benefits from smaller payloads)

| File | Table | New Constant |
|------|-------|--------------|
| `supabase/functions/process-knowledge-source/index.ts` | knowledge_sources | Create `KNOWLEDGE_SOURCE_FULL_COLUMNS` |
| `supabase/functions/dispatch-webhook-event/index.ts` | webhooks | `WEBHOOK_COLUMNS` |
| `supabase/functions/check-calendar-availability/index.ts` | connected_accounts | Create `CONNECTED_ACCOUNT_COLUMNS` |
| `supabase/functions/send-scheduled-report/index.ts` | scheduled_reports | `SCHEDULED_REPORT_COLUMNS` |
| `supabase/functions/handle-signup/index.ts` | pending_invitations | Create `PENDING_INVITATION_COLUMNS` |
| `supabase/functions/google-calendar-webhook/index.ts` | connected_accounts | `CONNECTED_ACCOUNT_COLUMNS` |
| `supabase/functions/trigger-webhook/index.ts` | webhooks | `WEBHOOK_COLUMNS` |
| `supabase/functions/google-calendar-auth/index.ts` (3x) | connected_accounts | `CONNECTED_ACCOUNT_COLUMNS` |
| `supabase/functions/outlook-calendar-auth/index.ts` (3x) | connected_accounts | `CONNECTED_ACCOUNT_COLUMNS` |

### New Column Constants to Add

```typescript
// Add to src/lib/db-selects.ts

/**
 * Columns for notification preferences.
 */
export const NOTIFICATION_PREFS_COLUMNS = `
  id,
  user_id,
  email_notifications,
  browser_notifications,
  new_conversation_email,
  new_message_email,
  new_lead_email,
  new_booking_email,
  new_takeover_email,
  daily_digest_enabled,
  weekly_report_enabled,
  daily_digest_time,
  weekly_report_day,
  created_at,
  updated_at
`;

/**
 * Columns for audit log entries.
 */
export const AUDIT_LOG_COLUMNS = `
  id,
  admin_user_id,
  action,
  target_type,
  target_id,
  target_email,
  details,
  ip_address,
  user_agent,
  created_at
`;

/**
 * Columns for pending invitations.
 */
export const PENDING_INVITATION_COLUMNS = `
  id,
  owner_id,
  email,
  role,
  status,
  expires_at,
  created_at
`;

/**
 * Columns for connected accounts (OAuth).
 */
export const CONNECTED_ACCOUNT_COLUMNS = `
  id,
  user_id,
  agent_id,
  location_id,
  provider,
  provider_account_id,
  email,
  access_token,
  refresh_token,
  token_expires_at,
  is_active,
  calendar_id,
  webhook_channel_id,
  webhook_expiration,
  sync_error,
  created_at,
  updated_at
`;

/**
 * Full columns for knowledge sources (processing).
 */
export const KNOWLEDGE_SOURCE_FULL_COLUMNS = `
  id,
  agent_id,
  user_id,
  source,
  type,
  source_type,
  status,
  content,
  refresh_strategy,
  default_location_id,
  location_name,
  created_at,
  updated_at,
  last_fetched_at,
  next_refresh_at
`;
```

### Edge Function Column Constants

For edge functions, create a shared constants file:

```typescript
// supabase/functions/_shared/db-columns.ts

export const CONNECTED_ACCOUNT_COLUMNS = `
  id, user_id, agent_id, location_id, provider, provider_account_id,
  email, access_token, refresh_token, token_expires_at, is_active,
  calendar_id, webhook_channel_id, webhook_expiration, sync_error,
  created_at, updated_at
`;

export const WEBHOOK_COLUMNS = `
  id, agent_id, user_id, name, url, method, events, headers,
  auth_type, auth_config, conditions, response_actions, active,
  created_at, updated_at
`;

export const KNOWLEDGE_SOURCE_COLUMNS = `
  id, agent_id, user_id, source, type, source_type, status, content,
  refresh_strategy, default_location_id, location_name,
  created_at, updated_at, last_fetched_at, next_refresh_at
`;

export const SCHEDULED_REPORT_COLUMNS = `
  id, user_id, name, frequency, day_of_week, day_of_month, time_of_day,
  timezone, recipients, report_config, active, last_sent_at, created_at
`;

export const PENDING_INVITATION_COLUMNS = `
  id, owner_id, email, role, status, expires_at, created_at
`;
```

---

## Part 3: Tighten Overly Permissive RLS Policies

### Policies Requiring Database Migration

| Table | Current Policy | Risk | New Policy |
|-------|----------------|------|------------|
| `messages` | `WITH CHECK (true)` | Anyone can insert | Verify conversation belongs to agent owned by user OR is active widget conversation |
| `article_feedback` | `WITH CHECK (true)` | Abuse vector | Rate limit + session validation |
| `kb_article_feedback` | `WITH CHECK (true)` | Abuse vector | Rate limit + session validation |
| `kb_article_views` | `WITH CHECK (true)` | Analytics poisoning | Session-based deduplication |
| `knowledge_chunks` | `WITH CHECK (true)` | Labeled "Service" | Restrict to `service_role` only |
| `lead_activities` | `WITH CHECK (true)` | Labeled "Service" | Restrict to `service_role` only |
| `pending_invitations` | `WITH CHECK (true)` | Labeled "System" | Restrict to `service_role` only |
| `usage_metrics` | `WITH CHECK (true)` | Labeled "System" | Restrict to `service_role` only |

### Migration SQL

```sql
-- 1. Fix messages INSERT policy
-- Widget messages should only be insertable for active widget conversations
DROP POLICY IF EXISTS "Public can create messages" ON public.messages;

CREATE POLICY "Insert messages for valid conversations" ON public.messages
FOR INSERT WITH CHECK (
  -- Service role can insert any message (for AI responses)
  auth.role() = 'service_role'
  OR
  -- Widget can insert to active widget conversations
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND c.channel = 'widget'
    AND c.status IN ('active', 'human_takeover')
    AND c.expires_at > now()
  )
  OR
  -- Authenticated users can insert to their own conversations
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND has_account_access(c.user_id)
  )
);

-- 2. Fix article_feedback - add rate limiting metadata check
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.article_feedback;

CREATE POLICY "Rate-limited feedback submission" ON public.article_feedback
FOR INSERT WITH CHECK (
  -- Require valid article reference
  article_id IS NOT NULL
  AND
  -- Rate limit: max 10 feedback per session per hour
  (SELECT COUNT(*) FROM article_feedback 
   WHERE session_id = (current_setting('request.headers', true)::json->>'x-session-id')
   AND created_at > now() - interval '1 hour') < 10
);

-- 3. Fix kb_article_feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.kb_article_feedback;

CREATE POLICY "Rate-limited KB feedback submission" ON public.kb_article_feedback
FOR INSERT WITH CHECK (
  article_id IS NOT NULL
  AND
  (SELECT COUNT(*) FROM kb_article_feedback 
   WHERE session_id = (current_setting('request.headers', true)::json->>'x-session-id')
   AND created_at > now() - interval '1 hour') < 20
);

-- 4. Fix kb_article_views - add basic validation
DROP POLICY IF EXISTS "Anyone can record article views" ON public.kb_article_views;

CREATE POLICY "Record article views with validation" ON public.kb_article_views
FOR INSERT WITH CHECK (
  article_id IS NOT NULL
  AND session_id IS NOT NULL
);

-- 5. Restrict service-only tables to service_role
DROP POLICY IF EXISTS "Service can insert chunks" ON public.knowledge_chunks;

CREATE POLICY "Service role can insert chunks" ON public.knowledge_chunks
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service can insert activities" ON public.lead_activities;

CREATE POLICY "Service role can insert activities" ON public.lead_activities
FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR
  -- Allow authenticated users to log activities for their own leads
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_id
    AND has_account_access(l.user_id)
  )
);

DROP POLICY IF EXISTS "System can insert invitations" ON public.pending_invitations;

CREATE POLICY "Service role can insert invitations" ON public.pending_invitations
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "System can insert usage metrics" ON public.usage_metrics;

CREATE POLICY "Service role can insert usage metrics" ON public.usage_metrics
FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/db-columns.ts` | Column constants for edge functions |

## Files to Modify

### Part 1: Catch Blocks (5 files)
- `supabase/functions/admin-update-plan/index.ts`
- `supabase/functions/send-push-notification/index.ts`
- `src/hooks/useServiceWorker.ts`
- `src/sw.ts`

### Part 2: select('*') Replacement (17 files)
- `src/lib/db-selects.ts` (add new constants)
- `src/hooks/useLocations.ts`
- `src/hooks/useProperties.ts`
- `src/components/settings/ProfileSettings.tsx`
- `src/components/settings/NotificationSettings.tsx`
- `src/hooks/admin/usePlatformHCCategories.ts`
- `src/hooks/admin/useRelatedAuditActivity.ts`
- `supabase/functions/process-knowledge-source/index.ts`
- `supabase/functions/dispatch-webhook-event/index.ts`
- `supabase/functions/check-calendar-availability/index.ts`
- `supabase/functions/send-scheduled-report/index.ts`
- `supabase/functions/handle-signup/index.ts`
- `supabase/functions/google-calendar-webhook/index.ts`
- `supabase/functions/trigger-webhook/index.ts`
- `supabase/functions/google-calendar-auth/index.ts`
- `supabase/functions/outlook-calendar-auth/index.ts`

### Part 3: RLS Policies (Database Migration)
- 8 policies to be replaced via Supabase migration tool

---

## Excluded from Scope

### OAuth Token Encryption (Item 6)
This is already documented in `docs/SECURITY.md` with manual setup instructions. It requires:
- `pgsodium` functions with elevated permissions
- Direct Supabase Dashboard SQL execution
- Manual creation of vault secret and encryption functions

**Current mitigations in place:**
- RLS policies restrict access to owner
- Supabase encrypts data at rest
- Token expiration/refresh flow
- Tokens only accessed server-side in edge functions

The documentation includes step-by-step SQL to run in the Supabase Dashboard when ready.

---

## Testing Checklist

After implementation:

### Part 1
- [ ] Verify edge functions handle errors correctly (check logs)
- [ ] Test service worker error scenarios

### Part 2  
- [ ] Run queries and verify same data returned with optimized columns
- [ ] Check network tab for reduced payload sizes
- [ ] Verify no runtime errors from missing columns

### Part 3
- [ ] Test widget message submission works
- [ ] Test article feedback submission with rate limiting
- [ ] Verify knowledge chunk insertion only works via service role
- [ ] Test lead activity logging for authenticated users
- [ ] Verify invitation creation via service role only

---

## Impact Summary

| Gap | Severity | Files | Effort |
|-----|----------|-------|--------|
| Untyped catch blocks | MEDIUM | 4 | 30 min |
| select('*') usage | MEDIUM | 17 | 2 hours |
| Permissive RLS | HIGH | 8 policies | 1 hour |
| **Total** | - | **29 changes** | **~3.5 hours** |

This addresses all actionable security gaps, with OAuth encryption documented for manual Dashboard setup.
