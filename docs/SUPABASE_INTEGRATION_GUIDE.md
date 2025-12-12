# Supabase + shadcn Full-Stack Assistant Guide

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [Database Schema](./DATABASE_SCHEMA.md), [Security](./SECURITY.md), [Edge Functions](./EDGE_FUNCTIONS.md)

Senior Full-Stack Developer guidelines for React, Supabase, and shadcn/ui integration. Build production-ready applications with authentication, real-time features, and comprehensive data management.

---

## Table of Contents

1. [Core Responsibilities](#core-responsibilities)
2. [Technology Stack Focus](#technology-stack-focus)
3. [Code Implementation Rules](#code-implementation-rules)
4. [Vite/React Adaptations](#vitereact-adaptations)
5. [ChatPad-Specific Database Patterns](#chatpad-specific-database-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Response Protocol](#response-protocol)
8. [Cross-References](#cross-references)

---

## Core Responsibilities
- Follow user requirements precisely and to the letter
- Think step-by-step: describe full-stack architecture plan in detailed pseudocode first
- Write correct, best practice, type-safe, secure full-stack code
- Prioritize authentication security, data validation, and user experience
- Implement all requested functionality completely
- Leave NO todos, placeholders, or missing pieces

## Technology Stack Focus
- **Supabase**: Database, Auth, Storage, Realtime, Edge Functions
- **Supabase UI Library**: Official shadcn/ui-based components
- **shadcn/ui**: Component library with Supabase UI integration
- **React Query (TanStack Query)**: Server state management and caching
- **TypeScript**: Strict typing for database models and API responses
- **Zod**: Schema validation for forms and API data

## Code Implementation Rules

### Supabase Integration Architecture
- Use Supabase's official UI Library components for rapid development
- Implement proper client-side and server-side Supabase client initialization
- Create type-safe database models using Supabase's generated types
- Use Row Level Security (RLS) policies for data protection
- Implement proper error handling for Supabase operations
- Support both real-time subscriptions and standard queries

### Authentication Patterns
- Use Supabase UI Library's Password-Based Authentication components
- Implement secure auth flows with proper session management
- Create protected routes with auth guards
- Handle auth state with React Query and proper context providers
- Support magic links, OAuth providers, and email/password authentication
- Implement proper logout and session cleanup

### Database Integration
- Generate and use Supabase TypeScript types for type safety
- Create custom React Query hooks for database operations
- Implement proper error handling and loading states
- Use optimistic updates with React Query mutations
- Support pagination, filtering, and sorting with Supabase queries
- Handle database relationships and joins efficiently

### Real-time Features
- Implement Supabase Realtime with shadcn/ui components
- Use Supabase UI Library's Realtime components (Chat, Cursors, Presence)
- Handle real-time subscriptions with proper cleanup
- Support collaborative features like live cursors and presence indicators
- Implement real-time data synchronization with local state
- Handle connection states and reconnection logic

### File Storage Integration
- Use Supabase UI Library's Dropzone component for file uploads
- Implement secure file upload with proper validation
- Handle file storage policies and access controls
- Support image optimization and CDN delivery
- Create file management interfaces with shadcn/ui
- Implement progress tracking and error handling for uploads

### React Query Integration
- Create custom hooks using React Query for Supabase operations
- Implement proper query key management and invalidation
- Use optimistic updates for better user experience
- Handle background refetching and stale data strategies
- Implement proper error boundaries and retry logic
- Support infinite queries for pagination

### Form Handling Patterns
- Use react-hook-form with Zod validation schemas
- Integrate shadcn/ui Form components with Supabase operations
- Implement proper form submission with loading states
- Handle form errors and validation feedback
- Support dynamic forms and conditional fields
- Create reusable form patterns for common operations

### Security Best Practices
- Implement proper Row Level Security policies
- Use environment variables for sensitive configuration
- Validate all inputs on both client and server
- Handle authentication tokens securely
- Implement proper CORS and security headers
- Use Supabase's built-in security features

### Performance Optimization
- Use React Query's caching strategies effectively
- Implement proper loading states and skeleton UIs
- Optimize database queries with proper indexing
- Use Supabase's CDN for static assets
- Implement code splitting and lazy loading
- Monitor and optimize bundle size

## Vite/React Adaptations

Since ChatPad uses Vite + React (not Next.js):
- **Server Actions** → Use Supabase Edge Functions
- **Route Handlers** → Use Supabase Edge Functions
- **App Router** → Use React Router patterns
- **Server Components** → Use client-side data fetching with React Query

## ChatPad-Specific Database Patterns

### Owner-Team Access Pattern
ChatPad uses a multi-tenant model where account owners can have team members who share access to resources.

```sql
-- Core access function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_account_access(account_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = account_owner_id 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE owner_id = account_owner_id 
      AND member_id = auth.uid()
    )
$$;

-- Usage in RLS policies
CREATE POLICY "Users can view accessible agents"
ON public.agents FOR SELECT
USING (has_account_access(user_id));
```

### Widget Public Access Pattern
Widget conversations require public access for anonymous users while protecting sensitive data.

```sql
-- Allow widget users to view their active conversations (by conversation ID)
CREATE POLICY "Widget users can view their active conversation by ID"
ON public.conversations FOR SELECT
USING (
  channel = 'widget' 
  AND status IN ('active', 'human_takeover') 
  AND expires_at > now()
);

-- Use secure views to filter sensitive metadata
CREATE VIEW widget_conversations_secure AS
SELECT 
  id, agent_id, status, created_at, updated_at, expires_at, user_id, channel,
  filter_widget_conversation_metadata(metadata) as metadata
FROM conversations;
```

### Trigger-Based User Initialization
Automatically create related records on user signup for reliability.

```sql
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    split_part(NEW.email, '@', 1)
  ))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
```

### Real-time Subscriptions with RLS
Enable real-time updates while respecting RLS policies.

```typescript
// Subscribe to conversation updates with proper filtering
const channel = supabase
  .channel('conversation-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleMessage)
  .subscribe();
```

## Performance Optimization

### Vector Indexes for RAG
Use IVFFlat indexes for embedding similarity search:

```sql
-- Index with lists = sqrt(expected_rows)
CREATE INDEX idx_knowledge_chunks_embedding 
ON public.knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);
```

### Query Indexes
Add indexes for common query patterns:

```sql
-- Conversations by created_at for analytics
CREATE INDEX idx_conversations_created_at 
ON public.conversations (created_at DESC);

-- Messages by conversation with ordering
CREATE INDEX idx_messages_created_at 
ON public.messages (conversation_id, created_at DESC);

-- Composite for filtered queries
CREATE INDEX idx_conversations_agent_status 
ON public.conversations (agent_id, status);
```

## Response Protocol
1. If uncertain about Supabase security implications, state so explicitly
2. If you don't know a specific Supabase API, admit it rather than guessing
3. Search for latest Supabase and React Query documentation when needed
4. Provide implementation examples only when requested
5. Stay focused on full-stack implementation over general architecture advice

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Complete table definitions and RLS policies
- [Security](./SECURITY.md) - Authentication and authorization patterns
- [Edge Functions](./EDGE_FUNCTIONS.md) - Server-side function implementations
- [Hooks Reference](./HOOKS_REFERENCE.md) - Custom React hooks documentation
