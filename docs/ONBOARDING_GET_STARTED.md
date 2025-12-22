# Get Started Onboarding Experience

> **Last Updated**: December 2025  
> **Status**: Active  
> **Related**: [Architecture](./ARCHITECTURE.md), [Design System](./DESIGN_SYSTEM.md), [Widget Architecture](./WIDGET_ARCHITECTURE.md)

## Table of Contents

1. [Product Vision](#product-vision)
2. [The 5 Setup Steps](#the-5-setup-steps)
3. [UI/UX Specification](#uiux-specification)
4. [Component Architecture](#component-architecture)
5. [Technical Implementation](#technical-implementation)
6. [Completion Tracking Logic](#completion-tracking-logic)
7. [Routing & Navigation Changes](#routing--navigation-changes)
8. [Edge Cases](#edge-cases)
9. [Implementation Phases](#implementation-phases)
10. [Success Metrics](#success-metrics)

---

## Product Vision

### Why Replace the Dashboard?

The current Dashboard shows metrics and data—but new users have **no data yet**. This creates a poor first experience:

- Empty charts and zero metrics feel discouraging
- Users don't know where to start
- High cognitive load figuring out the product
- Increased churn from confusion

### The Solution: Get Started

Replace Dashboard with a **guided onboarding checklist** that:

1. **Shows exactly what to do** — 5 clear, ordered steps
2. **Celebrates progress** — Visual feedback and micro-celebrations
3. **Disappears when complete** — Transitions to Analytics as new home
4. **Is not a menu item** — Like Intercom's Fin, it's contextual, not navigational

### Design Philosophy

- **5th-grader simple** — Anyone can follow without training
- **Value-first ordering** — Each step builds toward a working AI agent
- **No dead ends** — Every step has a clear action button
- **Real completion tracking** — Based on actual data, not manual checkboxes

---

## The 5 Setup Steps

Each step is designed to be completable in under 2 minutes.

### Step 1: Give Ari a Personality

| Attribute | Value |
|-----------|-------|
| **Title** | Give Ari a personality |
| **Subtitle** | Tell Ari how to talk, what tone to use, and what to focus on |
| **Icon** | `Sparkles` or `MessageSmileSquare` |
| **Completion Criteria** | `agents.system_prompt` length > 50 characters |
| **CTA Button** | "Write System Prompt" |
| **CTA Route** | `/ari` → scrolls to System Prompt section |
| **Why First** | The AI needs personality before knowledge—sets the foundation |

**Preview Panel Content:**
- Example system prompts
- Tips for writing effective prompts
- Live preview of Ari responding with personality

---

### Step 2: Teach Ari Your Business

| Attribute | Value |
|-----------|-------|
| **Title** | Teach Ari your business |
| **Subtitle** | Add your website, docs, or FAQs so Ari knows how to help |
| **Icon** | `BookOpen01` or `GraduationHat01` |
| **Completion Criteria** | `knowledge_sources` count > 0 with status = 'ready' |
| **CTA Button** | "Add Knowledge" |
| **CTA Route** | `/ari` → scrolls to Knowledge section |
| **Why Second** | AI needs knowledge to answer real questions |

**Preview Panel Content:**
- Types of knowledge sources (URL, sitemap, manual)
- Before/after showing generic vs. informed responses
- Processing status indicator

---

### Step 3: Customize the Look

| Attribute | Value |
|-----------|-------|
| **Title** | Customize the look |
| **Subtitle** | Match the chat widget to your brand colors |
| **Icon** | `Palette` or `Colors` |
| **Completion Criteria** | `deployment_config.widgetColor` is not default OR any appearance setting changed |
| **CTA Button** | "Customize Widget" |
| **CTA Route** | `/ari` → scrolls to Appearance section |
| **Why Third** | Visual customization creates ownership and investment |

**Preview Panel Content:**
- Live widget preview with current colors
- Color picker preview
- Before/after brand comparison

---

### Step 4: Install on Your Site

| Attribute | Value |
|-----------|-------|
| **Title** | Install on your site |
| **Subtitle** | Copy the embed code to add Ari to your website |
| **Icon** | `Code02` or `CodeBrowser` |
| **Completion Criteria** | `localStorage` flag `has_viewed_embed_code_${agentId}` = true |
| **CTA Button** | "Get Embed Code" |
| **CTA Route** | `/ari` → scrolls to Installation section |
| **Why Fourth** | Installation is the bridge from setup to live |

**Preview Panel Content:**
- The embed code snippet (copyable)
- Platform-specific instructions (WordPress, Shopify, HTML)
- "Test locally" instructions

---

### Step 5: Test Your First Chat

| Attribute | Value |
|-----------|-------|
| **Title** | Test your first chat |
| **Subtitle** | Send a message to see Ari in action |
| **Icon** | `MessageChatCircle` or `Send01` |
| **Completion Criteria** | `conversations` count > 0 for this agent |
| **CTA Button** | "Open Chat Preview" |
| **CTA Route** | Opens widget preview in bottom-right corner |
| **Why Last** | Validates everything works—the "aha!" moment |

**Preview Panel Content:**
- Live widget preview (interactive)
- Suggested test questions based on knowledge sources
- "What to look for" checklist

---

## UI/UX Specification

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Sidebar - 64px collapsed]                                              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  Welcome back, {firstName}! 👋                                    │ │
│  │  Let's get Ari ready to help your customers.                     │ │
│  │                                                                   │ │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐ │ │
│  │  │                             │  │                             │ │ │
│  │  │  ◉ Get set up              │  │   [Context-aware preview]   │ │ │
│  │  │    2 of 5 steps complete    │  │                             │ │ │
│  │  │                             │  │   Changes based on which    │ │ │
│  │  │  ━━━━━━━━━░░░░░░░░░░░ 40%  │  │   step is hovered/selected  │ │ │
│  │  │                             │  │                             │ │ │
│  │  │  ┌─────────────────────┐   │  │   Could show:               │ │ │
│  │  │  │ ✓ Give Ari a        │   │  │   - Helpful tips            │ │ │
│  │  │  │   personality       │   │  │   - Video walkthrough       │ │ │
│  │  │  │   Completed ✓       │   │  │   - Live widget preview     │ │ │
│  │  │  └─────────────────────┘   │  │   - Example content         │ │ │
│  │  │                             │  │                             │ │ │
│  │  │  ┌─────────────────────┐   │  │                             │ │ │
│  │  │  │ ✓ Teach Ari your    │   │  │                             │ │ │
│  │  │  │   business          │   │  │                             │ │ │
│  │  │  │   1 source added ✓  │   │  │                             │ │ │
│  │  │  └─────────────────────┘   │  │                             │ │ │
│  │  │                             │  │                             │ │ │
│  │  │  ┌─────────────────────┐   │  │                             │ │ │
│  │  │  │ ▶ Customize look    │←──┼──┼── Current step (expanded)   │ │ │
│  │  │  │                     │   │  │                             │ │ │
│  │  │  │   Match the chat    │   │  │                             │ │ │
│  │  │  │   widget to your    │   │  │                             │ │ │
│  │  │  │   brand colors      │   │  │                             │ │ │
│  │  │  │                     │   │  │                             │ │ │
│  │  │  │   [Customize →]     │   │  │                             │ │ │
│  │  │  └─────────────────────┘   │  │                             │ │ │
│  │  │                             │  │                             │ │ │
│  │  │  ○ Install on your site    │  │                             │ │ │
│  │  │  ○ Test your first chat    │  │                             │ │ │
│  │  │                             │  │                             │ │ │
│  │  └─────────────────────────────┘  └─────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ─────────────────────────────────────────────────────────────── │ │
│  │                                                                   │ │
│  │  Go further                                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │ │
│  │  │ 🔗 Webhooks  │  │ 🛠 Tools     │  │ 📊 Analytics │            │ │
│  │  │              │  │              │  │              │            │ │
│  │  │ Connect to   │  │ Add custom   │  │ Track your   │            │ │
│  │  │ your tools   │  │ API tools    │  │ performance  │            │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Design Tokens

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page background | `bg-muted/30` | `bg-background` |
| Checklist card | `bg-card border-border` | `bg-card border-border` |
| Completed step bg | `bg-status-active/5` | `bg-status-active/10` |
| Current step bg | `bg-card` with `ring-2 ring-primary` | Same |
| Incomplete step bg | `bg-muted/50` | `bg-muted/30` |
| Progress bar track | `bg-muted` | `bg-muted` |
| Progress bar fill | `bg-primary` | `bg-primary` |
| Checkmark icon | `text-status-active` | `text-status-active` |
| Step number (incomplete) | `text-muted-foreground` | `text-muted-foreground` |

### Typography

| Element | Style |
|---------|-------|
| Welcome heading | `text-2xl font-semibold text-foreground` |
| Welcome subheading | `text-base text-muted-foreground` |
| Checklist title | `text-lg font-semibold` |
| Step count | `text-sm text-muted-foreground` |
| Step title | `text-base font-medium` |
| Step subtitle | `text-sm text-muted-foreground` |
| CTA button | `Button variant="default"` |

### Spacing

| Element | Value |
|---------|-------|
| Page padding | `p-6 lg:p-8` |
| Content max-width | `max-w-5xl mx-auto` |
| Gap between columns | `gap-8` |
| Gap between steps | `gap-3` |
| Step internal padding | `p-4` |
| "Go further" section margin-top | `mt-12` |
| "Go further" card gap | `gap-4` |

### Animations

| Element | Animation |
|---------|-----------|
| Step completion | Checkmark animates in with spring physics, confetti burst |
| Progress bar | Width transitions with `ease-out 500ms` |
| Step expansion | Height auto with `ease-out 200ms` |
| Current step ring | Subtle pulse animation |
| 100% completion | Full-screen confetti, then fade to Analytics |

### Mobile Layout (< 768px)

- Single column, no preview panel
- Steps are touch-friendly accordions (min 48px tap targets)
- Progress bar at top, sticky
- CTAs are full-width buttons
- "Go further" cards stack vertically

---

## Component Architecture

### File Structure

```
src/
├── pages/
│   ├── GetStarted.tsx              # Main page component
│   └── GetStartedWrapper.tsx       # Wrapper with PageTransition
│
├── components/
│   └── onboarding/
│       ├── SetupChecklist.tsx      # The interactive checklist container
│       ├── SetupStepCard.tsx       # Individual expandable step
│       ├── SetupPreviewPanel.tsx   # Right-side context panel
│       ├── SetupProgress.tsx       # Progress bar with count
│       ├── GoFurtherSection.tsx    # Advanced features cards
│       └── CompletionCelebration.tsx # Full-screen confetti on 100%
│
├── hooks/
│   └── useOnboardingProgress.ts    # Hook to track completion state
```

### Component Specifications

#### `GetStarted.tsx`

```tsx
// Main page layout
// - Header with welcome message
// - Two-column grid (checklist + preview)
// - "Go further" section below
// - Handles completion redirect to /analytics
```

#### `SetupChecklist.tsx`

```tsx
interface SetupChecklistProps {
  steps: OnboardingStep[];
  currentStepId: string | null;
  onStepClick: (stepId: string) => void;
  onStepAction: (stepId: string) => void;
}

// Renders the list of SetupStepCard components
// Manages which step is expanded (first incomplete by default)
// Shows overall progress at top
```

#### `SetupStepCard.tsx`

```tsx
interface SetupStepCardProps {
  step: OnboardingStep;
  isExpanded: boolean;
  isCurrent: boolean;
  isComplete: boolean;
  onClick: () => void;
  onAction: () => void;
}

// Expandable card with:
// - Step number or checkmark
// - Title and subtitle
// - Expanded content with description + CTA
// - Visual states for complete/current/incomplete
```

#### `SetupPreviewPanel.tsx`

```tsx
interface SetupPreviewPanelProps {
  activeStep: OnboardingStep | null;
}

// Context-aware right panel showing:
// - Tips and guidance for current step
// - Live widget preview (for appearance/test steps)
// - Example content
// - Smooth transitions between steps
```

---

## Technical Implementation

### Data Flow

```
┌─────────────────────┐
│  useOnboardingProgress()  │
│                     │
│  Fetches:           │
│  - Agent data       │
│  - Knowledge count  │
│  - Conversations    │
│  - localStorage     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Computes:          │
│  - steps[]          │
│  - completedCount   │
│  - allComplete      │
│  - currentStep      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  GetStarted.tsx     │
│                     │
│  - Renders UI       │
│  - Handles actions  │
│  - Redirects when   │
│    allComplete      │
└─────────────────────┘
```

### `useOnboardingProgress` Hook

```typescript
interface OnboardingStep {
  id: 'personality' | 'knowledge' | 'appearance' | 'installation' | 'test';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  isComplete: boolean;
  action: {
    label: string;
    route: string;
    section?: string;
  };
}

interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  allComplete: boolean;
  currentStep: OnboardingStep | null;
  isLoading: boolean;
  refetch: () => void;
}

function useOnboardingProgress(): OnboardingProgress {
  const { agent } = useAgent();
  const { sources: knowledgeSources } = useKnowledgeSources(agent?.id);
  const { conversations } = useConversations();
  
  // Completion checks
  const personalityComplete = (agent?.system_prompt?.length ?? 0) > 50;
  const knowledgeComplete = knowledgeSources?.filter(s => s.status === 'ready').length > 0;
  const appearanceComplete = hasCustomAppearance(agent?.deployment_config);
  const installationComplete = localStorage.getItem(`has_viewed_embed_code_${agent?.id}`) === 'true';
  const testComplete = conversations?.length > 0;
  
  // Build steps array with completion status
  // Return computed values
}
```

### Completion Criteria Details

| Step | Check | Source |
|------|-------|--------|
| Personality | `system_prompt?.length > 50` | `agents` table via `useAgent` |
| Knowledge | `knowledgeSources.filter(s => s.status === 'ready').length > 0` | `knowledge_sources` table via `useKnowledgeSources` |
| Appearance | `deployment_config.widgetColor !== undefined` OR `deployment_config.gradientStart !== defaultGradientStart` | `agents.deployment_config` JSONB |
| Installation | `localStorage.get('has_viewed_embed_code_{agentId}')` | Client-side localStorage |
| Test | `conversations.length > 0` | `conversations` table via `useConversations` |

### Setting the Installation Flag

In the Installation section of AriConfigurator:

```typescript
// When user views embed code section
useEffect(() => {
  if (agent?.id && activeSection === 'installation') {
    localStorage.setItem(`has_viewed_embed_code_${agent.id}`, 'true');
    // Trigger refetch of onboarding progress
  }
}, [activeSection, agent?.id]);
```

---

## Routing & Navigation Changes

### Route Configuration

```tsx
// App.tsx

// The "/" route now conditionally renders
<Route 
  path="/" 
  element={
    <ConditionalHomeRoute />
  } 
/>

// ConditionalHomeRoute component
function ConditionalHomeRoute() {
  const { allComplete, isLoading } = useOnboardingProgress();
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (allComplete) {
    return <Navigate to="/analytics" replace />;
  }
  
  return <GetStartedWrapper />;
}
```

### Sidebar Changes

| Change | Before | After |
|--------|--------|-------|
| First menu item | "Dashboard" → `/` | "Ari" → `/ari` |
| Dashboard in menu | ✅ Visible | ❌ Removed entirely |
| Home behavior | Shows Dashboard | Shows Get Started OR redirects to Analytics |

### Navigation from Get Started

When user clicks a step's CTA button:

```typescript
const handleStepAction = (step: OnboardingStep) => {
  if (step.action.section) {
    // Navigate to Ari page and scroll to section
    navigate('/ari');
    // Use a slight delay to allow page to render
    setTimeout(() => {
      const element = document.getElementById(step.action.section);
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    navigate(step.action.route);
  }
};
```

---

## Edge Cases

### New User (No Agent Exists)

**Scenario:** User signs up but no agent has been created yet.

**Handling:**
- The existing `useAgent` hook auto-creates a default "Ari" agent on first access
- Get Started page waits for agent creation before rendering steps
- Show skeleton loading state during agent creation

### User Completes Step Elsewhere

**Scenario:** User navigates directly to `/ari`, completes a step, then returns to Get Started.

**Handling:**
- `useOnboardingProgress` uses React Query with `refetchOnWindowFocus: true`
- Steps automatically update when user returns
- Real-time subscription to agent changes (optional enhancement)

### User Skips Get Started

**Scenario:** User clicks sidebar nav to go directly to another page.

**Handling:**
- Allow navigation anywhere—don't block the user
- "/" always returns to Get Started until all steps complete
- Consider subtle reminder badge on "Home" menu item showing "3/5"

### All Steps Complete

**Scenario:** User finishes the 5th step.

**Handling:**
1. Trigger confetti celebration animation
2. Show "You're all set!" message with CTA to "Go to Analytics"
3. After 3 seconds OR on CTA click, redirect to `/analytics`
4. Future visits to "/" auto-redirect to `/analytics`

### Returning User (All Steps Already Complete)

**Scenario:** User who completed onboarding returns to the app.

**Handling:**
- "/" immediately redirects to `/analytics`
- No Get Started page shown at all
- Fast, no loading flicker

### Step Regresses (e.g., Knowledge Source Deleted)

**Scenario:** User deletes their only knowledge source after completing step 2.

**Handling:**
- Step 2 becomes incomplete again
- "/" shows Get Started page again
- User can re-complete the step

---

## Implementation Phases

### Phase 1: Foundation (Day 1)

**Goal:** Basic page structure and routing

1. Create `useOnboardingProgress` hook with completion logic
2. Create `GetStarted.tsx` page with static layout
3. Create `GetStartedWrapper.tsx`
4. Update `App.tsx` routing to use conditional home route
5. Update `Sidebar.tsx` to remove Dashboard menu item

**Deliverable:** Working page at "/" with static checklist, proper routing

---

### Phase 2: Interactive Checklist (Day 2)

**Goal:** Fully functional expandable checklist

1. Create `SetupStepCard.tsx` with expand/collapse
2. Create `SetupChecklist.tsx` container
3. Create `SetupProgress.tsx` progress bar
4. Wire up step click handlers and CTA navigation
5. Add proper visual states (complete/current/incomplete)

**Deliverable:** Interactive checklist that navigates to correct sections

---

### Phase 3: Preview Panel (Day 3)

**Goal:** Context-aware right panel

1. Create `SetupPreviewPanel.tsx`
2. Add content for each step (tips, examples)
3. Add live widget preview for appearance/test steps
4. Add smooth transitions between step content
5. Handle mobile layout (hidden on mobile)

**Deliverable:** Right panel updates based on selected step

---

### Phase 4: Polish & Celebrations (Day 4)

**Goal:** Delightful micro-interactions

1. Add step completion animations (checkmark, confetti)
2. Add progress bar animation
3. Create `CompletionCelebration.tsx` for 100% complete
4. Add "Go further" section with feature cards
5. Test all edge cases
6. Mobile responsive polish

**Deliverable:** Production-ready onboarding experience

---

## Success Metrics

### Quantitative

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Setup completion rate | >80% complete all 5 steps within 7 days | Track `allComplete` flag + timestamp |
| Time to first value | <10 minutes to send first test chat | Track time between signup and first conversation |
| Step abandonment | <10% abandon at any single step | Track step completion events |
| Return to Get Started | <5% return after completing | Track visits to "/" after completion |

### Qualitative

- User feedback: "I knew exactly what to do"
- Support tickets about "how to start" decrease by 50%
- User-reported confidence in product increases

### Tracking Implementation

```typescript
// Track step completion
const trackStepComplete = (stepId: string) => {
  // Analytics event
  analytics.track('onboarding_step_complete', {
    step_id: stepId,
    step_number: getStepNumber(stepId),
    time_since_signup: getTimeSinceSignup(),
  });
};

// Track full completion
const trackOnboardingComplete = () => {
  analytics.track('onboarding_complete', {
    total_time_minutes: getTotalOnboardingTime(),
    steps_in_order: getStepCompletionOrder(),
  });
};
```

---

## Appendix: Step Content Details

### Step 1: Personality — Preview Panel Content

```markdown
## Tips for a great system prompt

**Do include:**
- Your company name and what you do
- The tone you want (friendly, professional, casual)
- Topics Ari should and shouldn't discuss
- How to handle questions Ari can't answer

**Example:**
"You are Ari, a helpful assistant for Acme Corp, a SaaS company 
that helps small businesses manage inventory. Be friendly but 
professional. If you don't know something, offer to connect 
the user with our support team."
```

### Step 2: Knowledge — Preview Panel Content

```markdown
## What makes good knowledge?

**Best sources:**
- Your FAQ page
- Product documentation
- Pricing page
- About page

**Ari will learn:**
- Facts about your business
- How to answer common questions
- Links to share with users

**Pro tip:** Start with your FAQ—it's usually the most valuable!
```

### Step 3: Appearance — Preview Panel Content

```markdown
## Match your brand

The chat widget will appear on your website, so make it feel like yours.

**You can customize:**
- Primary and secondary brand colors
- Gradient for the header
- Light or dark theme

[Live widget preview with current colors]
```

### Step 4: Installation — Preview Panel Content

```markdown
## Add Ari to your site

Copy this code and paste it before the closing </body> tag:

\`\`\`html
<script src="https://your-domain/widget.js" 
  data-agent-id="xxx"></script>
\`\`\`

**Works with:**
- Any HTML website
- WordPress (paste in footer)
- Shopify (paste in theme.liquid)
- Webflow (paste in custom code)
```

### Step 5: Test Chat — Preview Panel Content

```markdown
## Take Ari for a spin!

Try asking Ari about your business. Here are some ideas:

- "What do you do?"
- "How much does it cost?"
- "How can I contact support?"

**What to look for:**
✓ Ari uses the tone you set
✓ Ari answers from your knowledge
✓ Ari admits when it doesn't know something

[Interactive widget preview]
```

---

## Related Documentation

- [Application Overview](./APPLICATION_OVERVIEW.md) — App architecture and routing
- [Design System](./DESIGN_SYSTEM.md) — Colors, typography, spacing
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) — How the chat widget works
- [Hooks Reference](./HOOKS_REFERENCE.md) — Custom hooks documentation
