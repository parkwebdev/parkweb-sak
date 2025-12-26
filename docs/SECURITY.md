# ChatPad Security Documentation

> **Last Updated**: December 2025  
> **Status**: Active  
> **Related**: [Database Schema](./DATABASE_SCHEMA.md), [Edge Functions](./EDGE_FUNCTIONS.md), [Widget Architecture](./WIDGET_ARCHITECTURE.md)

Security implementation details for the ChatPad platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Row Level Security](#row-level-security)
4. [API Security](#api-security)
5. [Widget Security](#widget-security)
6. [Data Protection](#data-protection)
7. [Type-Safe Error Handling](#type-safe-error-handling)
8. [Audit Logging](#audit-logging)

---

## Overview

ChatPad implements defense-in-depth security with multiple layers:

1. **Content Security Policy**: CSP headers to prevent XSS and injection attacks
2. **Authentication**: Supabase Auth with JWT tokens
3. **Authorization**: Row Level Security (RLS) policies
4. **Input Validation**: Server-side validation and sanitization
5. **XSS Protection**: DOMPurify sanitization
6. **Spam Protection**: Honeypot, timing, and rate limiting
7. **Audit Logging**: Security event tracking

---

## Content Security Policy (CSP)

ChatPad implements CSP via meta tags with different policies for the admin app and embeddable widget:

### Main Application (index.html)

Strict policy with clickjacking protection:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://mvaimvwdukpgvkifkfpa.supabase.co;
connect-src 'self' https://mvaimvwdukpgvkifkfpa.supabase.co wss://mvaimvwdukpgvkifkfpa.supabase.co;
media-src 'self';
frame-src 'self';
frame-ancestors 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

### Embeddable Widget (widget.html)

Permissive policy for embedding on customer sites:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://mvaimvwdukpgvkifkfpa.supabase.co https://*;
connect-src 'self' https://mvaimvwdukpgvkifkfpa.supabase.co wss://mvaimvwdukpgvkifkfpa.supabase.co;
media-src 'self' blob:;
frame-src 'self';
object-src 'none';
base-uri 'self';
upgrade-insecure-requests;
```

**Key Differences:**
- Widget omits `frame-ancestors` to allow embedding anywhere
- Widget allows `https://*` for `img-src` to display link preview images from external sites
- Widget allows `blob:` for `media-src` to support voice recording playback

### CSP Protection Benefits

| Protection | Directive |
|------------|-----------|
| Block external malicious scripts | `script-src 'self'` |
| Prevent data exfiltration | `connect-src` whitelist |
| Block malicious iframes | `frame-src 'self'` |
| Prevent clickjacking (admin) | `frame-ancestors 'self'` |
| Block plugin exploits | `object-src 'none'` |
| Prevent base tag hijacking | `base-uri 'self'` |
| Block form data theft | `form-action 'self'` |
| Enforce HTTPS | `upgrade-insecure-requests` |

### Why 'unsafe-inline' is Required

The `'unsafe-inline'` directive is necessary for:
- **Vite**: Uses inline module scripts for dynamic imports
- **Tailwind/Radix**: Inject inline styles for dynamic components  
- **Motion/Framer**: Apply inline transforms for animations

Without server-side rendering for nonces/hashes, this is the practical approach while still providing significant protection through source whitelisting.

---

## Authentication

### Supabase Auth

ChatPad uses Supabase Auth for user authentication:

```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { display_name: name }
  }
});

// Session management
const { data: { session } } = await supabase.auth.getSession();
```

### JWT Tokens

- Access tokens expire after 1 hour
- Refresh tokens used for session continuity
- Tokens validated on every API request

### Role-Based Access

Roles stored in separate `user_roles` table (not in profile):

```sql
-- Role hierarchy
super_admin > admin > manager > member > client

-- Check role
SELECT role FROM user_roles WHERE user_id = auth.uid();
```

**CRITICAL**: Never store roles in `profiles` table or client-side storage.

---

## Row Level Security

### Core Access Pattern

ChatPad uses `has_account_access()` for team-based access:

```sql
-- Security definer function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_account_access(account_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = account_owner_id 
     OR EXISTS (
       SELECT 1 FROM team_members 
       WHERE owner_id = account_owner_id 
         AND member_id = auth.uid()
     )
$$;
```

### Standard Policy Pattern

```sql
-- View accessible resources
CREATE POLICY "Users can view accessible resources"
ON public.agents
FOR SELECT
USING (has_account_access(user_id));

-- Create owned resources
CREATE POLICY "Users can create their own agents"
ON public.agents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Modify accessible resources
CREATE POLICY "Users can update accessible agents"
ON public.agents
FOR UPDATE
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible agents"
ON public.agents
FOR DELETE
USING (has_account_access(user_id));
```

### Admin Access Pattern

```sql
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = target_user_id 
      AND role IN ('admin', 'super_admin')
  );
$$;

-- Admin-only policy
CREATE POLICY "Admins can view all security logs"
ON public.security_logs
FOR SELECT
USING (is_admin(auth.uid()));
```

### Public Access Pattern (Widget)

```sql
-- Allow widget to create conversations
CREATE POLICY "Public can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Allow widget to read active conversations
CREATE POLICY "Public can view conversation status"
ON public.conversations
FOR SELECT
USING (true);  -- Widget filters by conversation_id client-side
```

---

## API Security

### Edge Function Authentication

**Public endpoints** (widget):
```toml
# supabase/config.toml
[functions.widget-chat]
verify_jwt = false

[functions.get-widget-config]
verify_jwt = false
```

**Authenticated endpoints** (admin):
```typescript
// Edge function validates JWT
const authHeader = req.headers.get('Authorization');
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader?.replace('Bearer ', '')
);

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders
  });
}
```

### API Key Authentication

For external integrations:

```typescript
// validate-api-key edge function
const hashedKey = await hashApiKey(providedKey);

const { data: apiKey } = await supabase
  .from('api_keys')
  .select('user_id, permissions')
  .eq('key', hashedKey)
  .single();

if (!apiKey) {
  return { valid: false };
}

// Update last used
await supabase
  .from('api_keys')
  .update({ last_used_at: new Date().toISOString() })
  .eq('key', hashedKey);

return {
  valid: true,
  userId: apiKey.user_id,
  permissions: apiKey.permissions
};
```

### Rate Limiting

Implemented at edge function level:

```typescript
// Check rate limit
const { data: recentRequests } = await supabase
  .from('rate_limits')
  .select('count')
  .eq('ip_address', clientIp)
  .eq('endpoint', endpoint)
  .gte('window_start', windowStart)
  .single();

if (recentRequests?.count >= MAX_REQUESTS_PER_WINDOW) {
  return new Response(JSON.stringify({ error: 'Rate limited' }), {
    status: 429,
    headers: corsHeaders
  });
}
```

---

## Widget Security

### XSS Protection

All HTML content sanitized with DOMPurify:

```typescript
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'span', 'div', 'img'
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'src', 'alt', 
  'width', 'height', 'style'
];

export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false
  });
}
```

**Applied to:**
- Help article content
- News item body
- Announcement text
- User-submitted comments

### Spam Protection

**1. Honeypot Field:**
```tsx
// Hidden field that bots fill out
<input
  type="text"
  name="website"
  style={{ display: 'none' }}
  tabIndex={-1}
  autoComplete="off"
/>
```

**2. Timing Check:**
```typescript
// Reject if form submitted too quickly
const formLoadTime = sessionStorage.getItem('formLoadTime');
if (Date.now() - parseInt(formLoadTime) < 2000) {
  throw new Error('Spam detected');
}
```

**3. Rate Limiting:**
```typescript
// One submission per email per minute
const { data: recent } = await supabase
  .from('leads')
  .select('created_at')
  .eq('email', email)
  .gte('created_at', oneMinuteAgo)
  .single();

if (recent) {
  throw new Error('Rate limited');
}
```

### Input Validation

**Phone Numbers:**
```typescript
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

if (!isValidPhoneNumber(phone)) {
  throw new Error('Invalid phone number');
}

const parsed = parsePhoneNumber(phone);
const formatted = parsed.formatInternational();
```

**Email:**
```typescript
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

if (!EMAIL_REGEX.test(email)) {
  throw new Error('Invalid email');
}
```

### Link Security

All links in articles open in new tabs with security attributes:

```typescript
// Tiptap Link extension config
Link.configure({
  HTMLAttributes: {
    target: '_blank',
    rel: 'noopener noreferrer'
  }
})
```

---

## Data Protection

### Sensitive Data Handling

**Passwords:**
- Handled by Supabase Auth
- Never stored in application tables
- bcrypt hashing with salt

**API Keys:**
- Hashed before storage
- Only preview (last 4 chars) shown to users
- Original key shown once on creation

**Personal Data:**
- Email addresses stored for functionality
- Phone numbers formatted and validated
- Names displayed with masked last names in widget

### Storage Security

**Public Buckets:**
```sql
-- Avatars bucket (public read)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**File Validation:**
```typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

### Image Optimization

Images optimized before storage to reduce attack surface:

---

## Type-Safe Error Handling

ChatPad enforces type-safe error handling to prevent accidental exposure of raw error objects or stack traces to users.

### The Pattern

All catch blocks **MUST** use `unknown` error type with `getErrorMessage()`:

```typescript
import { getErrorMessage } from '@/types/errors';

try {
  await riskyOperation();
} catch (error: unknown) {
  // Safe - extracts string message, never exposes internals
  toast.error('Operation failed', { description: getErrorMessage(error) });
  console.error('Error details:', getErrorMessage(error));
}
```

### Security Benefits

1. **Prevents stack trace leakage**: Raw error objects may contain file paths, line numbers, or internal details
2. **Consistent user messaging**: Users always see meaningful messages, never `[object Object]`
3. **Type safety**: ESLint rules catch violations at development time
4. **Defensive coding**: Handles unexpected error types gracefully

### Enforced By

- ESLint rules: `@typescript-eslint/no-unsafe-*`
- Code review standards
- All 100+ catch blocks in codebase follow this pattern

**See**: [DESIGN_SYSTEM.md#error-handling-pattern](./DESIGN_SYSTEM.md#error-handling-pattern) for full documentation.

```typescript
// Resize and convert to WebP
async function optimizeImage(file: File, maxWidth: number, maxHeight: number) {
  const canvas = document.createElement('canvas');
  // ... resize logic
  return canvas.toBlob(blob => blob, 'image/webp', 0.6);
}
```

---

## Audit Logging

### Security Events

All security-relevant events logged to `security_logs`:

```typescript
// Log via database function
await supabase.rpc('log_security_event', {
  p_user_id: userId,
  p_action: 'team_member_invited',
  p_resource_type: 'team_members',
  p_resource_id: memberId,
  p_success: true,
  p_details: { email: inviteeEmail }
});
```

### Logged Events

| Action | Resource Type | Description |
|--------|---------------|-------------|
| `user_login` | `auth` | User login attempt |
| `user_logout` | `auth` | User logout |
| `password_change` | `auth` | Password changed |
| `api_key_created` | `api_keys` | New API key created |
| `api_key_deleted` | `api_keys` | API key deleted |
| `api_key_used` | `api_keys` | API key used |
| `team_member_invited` | `team_members` | Invitation sent |
| `team_member_joined` | `team_members` | Invitation accepted |
| `team_member_removed` | `team_members` | Member removed |
| `agent_created` | `agents` | Agent created |
| `agent_deleted` | `agents` | Agent deleted |
| `takeover_started` | `conversations` | Human takeover |
| `takeover_ended` | `conversations` | Returned to AI |

### Log Structure

```sql
CREATE TABLE security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  success boolean DEFAULT true,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

### Access Control

```sql
-- Users can view their own logs
CREATE POLICY "Users can view their own security logs"
ON security_logs FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all security logs"
ON security_logs FOR SELECT
USING (is_admin(auth.uid()));
```

---

## Security Checklist

### Development

- [ ] All user input validated server-side
- [ ] HTML content sanitized with DOMPurify
- [ ] SQL queries use parameterized statements (Supabase client handles this)
- [ ] Sensitive data not logged
- [ ] Error messages don't leak implementation details

### Deployment

- [ ] All edge functions have appropriate JWT verification
- [ ] RLS policies cover all tables
- [ ] Storage policies restrict file types
- [ ] Rate limiting enabled on public endpoints
- [ ] CORS headers properly configured

### Monitoring

- [ ] Security logs reviewed regularly
- [ ] Failed login attempts monitored
- [ ] API key usage tracked
- [ ] Rate limit violations logged

---

## Incident Response

### Suspicious Activity

1. Check `security_logs` for unusual patterns
2. Review failed authentication attempts
3. Check API key usage logs
4. Review rate limit violations

### Compromised Credentials

1. Immediately revoke affected API keys
2. Force password reset for user
3. Review security logs for affected user
4. Notify user of incident

### Data Breach

1. Identify affected records
2. Disable affected accounts/keys
3. Review access logs
4. Document incident timeline
5. Notify affected users per legal requirements

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - RLS policies and table structures
- [Edge Functions](./EDGE_FUNCTIONS.md) - Server-side security implementation
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget security patterns
- [Supabase Integration](./SUPABASE_INTEGRATION_GUIDE.md) - Authentication patterns
