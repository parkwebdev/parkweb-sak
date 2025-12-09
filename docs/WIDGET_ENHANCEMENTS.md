# Widget Enhancement Features

This document catalogs recommended chat widget improvements based on industry standards. Features are prioritized by business value and implementation complexity.

---

## High Priority Features

### 1. Satisfaction Ratings ⭐
**Status**: ✅ Implemented
**Complexity**: Medium  
**Business Value**: High - Direct feedback on AI/team performance

**Description**: Post-conversation 1-5 star rating with optional text feedback. Triggers when:
1. Team member closes conversation
2. AI determines conversation is complete (via tool calling)

**Technical Approach**:
- AI uses `mark_conversation_complete` tool when confident user is satisfied
- Widget shows rating prompt after trigger (3-second delay)
- Ratings stored in `conversation_ratings` table
- Dashboard analytics for rating trends

**Database Schema**:
```sql
CREATE TABLE conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('team_closed', 'ai_marked_complete')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 2. Message Copy Button
**Status**: Not Started  
**Complexity**: Low  
**Business Value**: Medium - Better UX for code/links/instructions

**Description**: One-click copy button appears on hover for assistant messages. Especially useful for:
- Code snippets
- URLs and links
- Step-by-step instructions
- Account details

**Technical Approach**:
- Add copy icon button to `MessageBubble` component
- Show on hover (desktop) or tap-hold (mobile)
- Use `navigator.clipboard.writeText()`
- Show brief "Copied!" toast feedback

---

### 3. Proactive Messages
**Status**: Not Started  
**Complexity**: Medium-High  
**Business Value**: High - Increase engagement, reduce bounce

**Description**: Automatically triggered messages based on:
- Time on page (e.g., "Need help finding something?" after 30 seconds)
- Specific page visits (e.g., pricing page → "Have questions about plans?")
- Scroll depth or exit intent
- Return visitor detection

**Technical Approach**:
- Add `proactive_messages` table with trigger conditions
- Widget tracks page time, scroll depth, URL patterns
- Evaluate triggers on interval (every 5 seconds)
- Show message as system notification or open widget
- Cooldown to prevent repeated triggers

**Database Schema**:
```sql
CREATE TABLE proactive_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'time_on_page', 'page_url', 'scroll_depth', 'exit_intent'
  trigger_config JSONB NOT NULL, -- { delay_seconds: 30 } or { url_pattern: '/pricing*' }
  enabled BOOLEAN DEFAULT true,
  cooldown_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4. Pre-chat Bot Flows
**Status**: Not Started  
**Complexity**: High  
**Business Value**: High - Better routing, reduced AI load

**Description**: Guided button-based flows before free-text input:
1. "What can I help with?" → [Sales] [Support] [Billing] [Other]
2. Based on selection, show relevant sub-options or route to specific team/AI persona
3. Captures intent before conversation starts

**Technical Approach**:
- Add `bot_flows` and `bot_flow_nodes` tables
- Flow builder UI in agent config
- Widget renders flow nodes as button options
- Flow completion populates conversation metadata with selections
- AI receives flow context in system prompt

---

### 5. Conversation Search
**Status**: Not Started  
**Complexity**: Medium  
**Business Value**: Medium - Better UX for returning users

**Description**: Search through conversation history in Messages view:
- Full-text search across all user's conversations
- Highlights matching messages
- Jump to specific message in conversation

**Technical Approach**:
- Add search input to MessagesView header
- Client-side filtering for current conversations
- Server-side full-text search for older conversations
- Use PostgreSQL `to_tsvector` for efficient search

---

## Medium Priority Features

### 6. Message Timestamps Toggle
**Status**: Not Started  
**Complexity**: Low  
**Business Value**: Low - Nice UX polish

**Description**: Option to show/hide timestamps on individual messages. Currently only shown on conversation cards.

**Technical Approach**:
- Add toggle in widget settings or per-message hover
- Format: "2:34 PM" for today, "Mon 2:34 PM" for this week, "Dec 5" for older

---

### 7. "Is This Helpful?" on AI Responses
**Status**: Not Started  
**Complexity**: Low-Medium  
**Business Value**: Medium - Granular feedback per response

**Description**: Thumbs up/down on individual AI messages (separate from conversation rating):
- Helps identify which responses need improvement
- Feeds into knowledge source quality metrics
- Can trigger human review for downvoted responses

**Technical Approach**:
- Add `message_feedback` table
- Icons appear below AI messages
- Aggregate stats in analytics dashboard
- Optionally trigger webhook on negative feedback

---

### 8. Conversation Tags/Topics
**Status**: Not Started  
**Complexity**: Medium  
**Business Value**: Medium - Better organization for admins

**Description**: Auto-categorize conversations by topic:
- AI auto-tags based on content (billing, technical, sales, etc.)
- Admins can manually add/remove tags
- Filter conversations by tag in admin panel

**Technical Approach**:
- Add `conversation_tags` table (many-to-many)
- AI extracts topics via tool calling
- Tag filter in Conversations page
- Tag distribution in analytics

---

### 9. Offline Mode Indicator
**Status**: Not Started  
**Complexity**: Low  
**Business Value**: Low-Medium - Transparency when unavailable

**Description**: Show clear indicator when:
- Widget loses internet connection
- AI service is unavailable
- Outside business hours (if configured)

**Technical Approach**:
- Monitor `navigator.onLine` events
- Catch API errors and show friendly message
- Queue messages for retry when back online
- Optional business hours config with "We'll respond when back" message

---

### 10. Scheduled Messages
**Status**: Not Started  
**Complexity**: Medium  
**Business Value**: Low - Niche use case

**Description**: Team members can schedule messages to send later:
- "Send this response at 9 AM tomorrow"
- Useful for different time zones
- Reminder to follow up

**Technical Approach**:
- Add `scheduled_at` column to messages
- Background job checks for pending scheduled messages
- Edge function cron trigger

---

## Nice to Have Features

### 11. Message Editing
**Status**: Not Started  
**Complexity**: Medium  
**Business Value**: Low - Correcting typos

**Description**: Edit sent messages within time window (e.g., 5 minutes):
- Shows "edited" indicator
- Stores edit history
- Only for user messages, not AI

---

### 12. Rich Message Types
**Status**: Not Started  
**Complexity**: High  
**Business Value**: Medium - Better product showcases

**Description**: Support for:
- Image carousels
- Button cards with actions
- Quick action grids
- Embedded videos
- Location maps

---

### 13. Screen Sharing / Co-browsing
**Status**: Not Started  
**Complexity**: Very High  
**Business Value**: High for support - Complex implementation

**Description**: Team member can request to view user's screen or highlight elements on their page for guided support.

---

### 14. Language Auto-detection
**Status**: Not Started  
**Complexity**: Medium  
**Business Value**: Medium - International support

**Description**: Detect user's language from first message and:
- Switch widget UI language
- Inform AI to respond in detected language
- Track language distribution in analytics

---

### 15. Widget Themes
**Status**: Not Started  
**Complexity**: Low-Medium  
**Business Value**: Low - Brand customization beyond colors

**Description**: Pre-built theme presets:
- Minimal/Clean
- Playful/Rounded
- Corporate/Sharp
- Dark mode only
- Custom CSS injection

---

## Implementation Roadmap

### Phase 1 (Completed)
1. ✅ Satisfaction Ratings (implemented)

### Phase 2 (Next Sprint)
2. Message Copy Button

### Phase 2
3. Proactive Messages
4. "Is This Helpful?" per message

### Phase 3
5. Pre-chat Bot Flows
6. Conversation Tags

### Phase 4
7. Conversation Search
8. Offline Mode Indicator

### Future Consideration
- Rich Message Types
- Language Auto-detection
- Screen Sharing (requires external service)

---

## Related Documentation
- [Widget Architecture](./WIDGET_ARCHITECTURE.md)
- [AI Architecture](./AI_ARCHITECTURE.md)
- [Edge Functions](./EDGE_FUNCTIONS.md)
