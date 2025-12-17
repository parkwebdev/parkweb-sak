# Widget Lazy Component Optimization Plan

> **CRITICAL REQUIREMENT**: All optimized components MUST be pixel-perfect visual matches to their original counterparts. NO visual changes are permitted. Only internal implementation changes to remove heavy dependencies.

## Executive Summary

This document outlines a phased approach to optimize lazy-loaded widget components by replacing heavy dependencies (motion/react, @radix-ui/*, libphonenumber-js) with lightweight CSS-based alternatives while maintaining **100% visual and functional parity**.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Phase 1: WidgetVoiceInput](#phase-1-widgetvoiceinput)
3. [Phase 2: WidgetFileDropZone](#phase-2-widgetfiledropzone)
4. [Phase 3: WidgetAudioPlayer](#phase-3-widgetaudioplayer)
5. [Phase 4: WidgetMessageReactions](#phase-4-widgetmessagereactions)
6. [Phase 5: WidgetPhoneInput](#phase-5-widgetphoneinput)
7. [Phase 6: Update Constants & Integration](#phase-6-update-constants--integration)
8. [Phase 7: Testing & Verification](#phase-7-testing--verification)
9. [Rollback Plan](#rollback-plan)

---

## Current State Analysis

### Current Lazy-Loaded Components (from `src/widget/constants.ts`)

| Component | Source File | Heavy Dependencies | Estimated Size Impact |
|-----------|-------------|-------------------|----------------------|
| VoiceInput | `@/components/molecule-ui/voice-input` | motion/react | ~50KB gzipped |
| FileDropZone | `@/components/chat/FileDropZone` | @/components/ui/button (motion) | ~50KB gzipped |
| MessageReactions | `@/components/chat/MessageReactions` | @radix-ui/react-popover, motion | ~65KB gzipped |
| AudioPlayer | `@/components/chat/AudioPlayer` | @/components/ui/button (motion) | ~50KB gzipped |
| PhoneInputField | `@/components/ui/phone-input` | libphonenumber-js/min | ~38KB gzipped |
| DayPicker | `@/widget/components/booking/DayPicker` | Already widget-native | 0KB |
| TimePicker | `@/widget/components/booking/TimePicker` | Already widget-native | 0KB |
| BookingConfirmed | `@/widget/components/booking/BookingConfirmed` | Already widget-native | 0KB |

### Dependency Chain Analysis

```
VoiceInput
├── motion/react (~50KB)
│   └── Framer Motion animations
└── @/components/ui/button
    └── motion/react (shared)

FileDropZone
├── @/components/ui/button
│   └── motion/react (~50KB)
└── FileAttachment component
    └── @/components/ui/button

MessageReactions
├── @radix-ui/react-popover (~15KB)
├── motion/react (~50KB)
└── @/components/ui/button

AudioPlayer
├── @/components/ui/button
│   └── motion/react (~50KB)
└── Canvas API (native, 0KB)

PhoneInputField
├── libphonenumber-js/min (~38KB)
├── @/components/ui/input
│   └── motion/react
└── AsYouType formatter
```

---

## Phase 1: WidgetVoiceInput

### Objective
Replace `@/components/molecule-ui/voice-input` with a widget-native version using CSS animations.

### Source Component Analysis

**File**: `src/components/molecule-ui/voice-input.tsx`

**Current Implementation Features**:
- Microphone button with pulse animation when recording
- Recording timer display (MM:SS format)
- Stop/Send button
- Cancel button
- Waveform visualization (optional)
- Motion.div scale animations on mount/unmount

### Visual Specifications (MUST MATCH EXACTLY)

#### Recording Button States

| State | Background | Border | Icon | Animation |
|-------|-----------|--------|------|-----------|
| Idle | transparent | border-input | Microphone01 (muted-foreground) | none |
| Hover | accent | border-input | Microphone01 (accent-foreground) | none |
| Recording | destructive/10 | destructive | Microphone01 (destructive) | pulse ring |
| Disabled | transparent | border-input | Microphone01 (muted-foreground/50) | none |

#### Pulse Animation CSS (EXACT MATCH)

```css
@keyframes widget-recording-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 hsl(var(--destructive) / 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px hsl(var(--destructive) / 0);
  }
}

.widget-recording-pulse {
  animation: widget-recording-pulse 1.5s ease-in-out infinite;
}
```

#### Recording Controls Layout

```
┌─────────────────────────────────────────────┐
│  [X Cancel]  ●REC 00:23  [■ Stop/Send]     │
└─────────────────────────────────────────────┘
```

- Cancel button: ghost variant, XClose icon, size="icon-sm"
- Timer: text-xs, text-destructive, with pulsing dot
- Stop button: destructive variant, StopCircle icon, size="icon-sm"

### Implementation Requirements

**File to Create**: `src/widget/components/WidgetVoiceInput.tsx`

```typescript
interface WidgetVoiceInputProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
  maxDuration?: number; // seconds, default 120
}
```

**Dependencies ALLOWED**:
- React (useState, useEffect, useRef, useCallback)
- `@/lib/audio-recording` (existing, no heavy deps)
- `WidgetButton` from `@/widget/ui/WidgetButton`
- Icons from `@/widget/icons` (must add Microphone01, StopCircle, XClose)

**Dependencies FORBIDDEN**:
- motion/react
- @radix-ui/*
- @/components/ui/button
- Any main app UI components

### Animation Replacements

| Original (motion/react) | Replacement (CSS) |
|------------------------|-------------------|
| `animate={{ scale: 1 }}` | CSS transition: transform 150ms ease-out |
| `initial={{ scale: 0.9 }}` | Initial state via CSS class |
| `exit={{ scale: 0.9, opacity: 0 }}` | CSS animation: widget-fade-out 150ms |
| Pulse ring animation | CSS keyframes (defined above) |

### Acceptance Criteria

- [ ] Microphone button appears identical to original
- [ ] Pulse animation timing matches exactly (1.5s ease-in-out)
- [ ] Recording timer format matches (MM:SS)
- [ ] Cancel/Stop buttons positioned identically
- [ ] Hover states match exactly
- [ ] Focus rings match (2px ring, ring-offset-2)
- [ ] Audio recording functionality unchanged
- [ ] No motion/react in bundle when component loads

---

## Phase 2: WidgetFileDropZone

### Objective
Replace `@/components/chat/FileDropZone` with a widget-native version.

### Source Component Analysis

**File**: `src/components/chat/FileDropZone.tsx`

**Current Implementation Features**:
- Drag-and-drop zone with dashed border
- File input trigger
- Selected files preview list
- Remove file button per item
- Cancel and Attach action buttons
- Drag hover visual feedback

### Visual Specifications (MUST MATCH EXACTLY)

#### Drop Zone States

| State | Border | Background | Text |
|-------|--------|-----------|------|
| Default | border-dashed border-2 border-muted-foreground/25 | transparent | "Drag files here or click to browse" |
| Drag Over | border-dashed border-2 border-primary | primary/5 | "Drop files here" |
| Has Files | border-solid border border-border | card | File list |

#### File Preview Item

```
┌─────────────────────────────────────────────┐
│  [📄]  filename.pdf              [X Remove] │
│        1.2 MB                               │
└─────────────────────────────────────────────┘
```

- Icon: File type icon (from FileTypeIcons)
- Filename: text-sm font-medium truncate
- Size: text-xs text-muted-foreground
- Remove: ghost button, XClose icon

#### Action Buttons

```
┌─────────────────────────────────────────────┐
│              [Cancel]  [Attach X files]     │
└─────────────────────────────────────────────┘
```

- Cancel: variant="ghost"
- Attach: variant="default", shows file count

### Implementation Requirements

**File to Create**: `src/widget/components/WidgetFileDropZone.tsx`

```typescript
interface WidgetFileDropZoneProps {
  onFilesSelected: (files: File[], urls: string[]) => void;
  onCancel: () => void;
  primaryColor?: string;
  maxFiles?: number; // default 5
  maxSizeBytes?: number; // default 10MB
}
```

**Dependencies ALLOWED**:
- React
- `WidgetButton` from `@/widget/ui/WidgetButton`
- `@/lib/file-validation` (existing)
- Icons from `@/widget/icons`

**Dependencies FORBIDDEN**:
- motion/react
- @/components/ui/button
- @/components/chat/FileAttachment (has motion deps)

### Acceptance Criteria

- [ ] Drop zone border style matches exactly
- [ ] Drag hover feedback matches
- [ ] File preview layout identical
- [ ] File type icons display correctly
- [ ] Remove button positioning matches
- [ ] Action button layout matches
- [ ] File validation behavior unchanged
- [ ] No motion/react in bundle

---

## Phase 3: WidgetAudioPlayer

### Objective
Replace `@/components/chat/AudioPlayer` with a widget-native version.

### Source Component Analysis

**File**: `src/components/chat/AudioPlayer.tsx`

**Current Implementation Features**:
- Play/Pause toggle button
- Waveform visualization (canvas)
- Current time / Total duration display
- Progress bar (clickable for seek)
- Frequency visualization while playing

### Visual Specifications (MUST MATCH EXACTLY)

#### Player Layout

```
┌─────────────────────────────────────────────┐
│  [▶]  ═══════════●═══════════  0:23 / 1:45 │
│       [waveform visualization canvas]       │
└─────────────────────────────────────────────┘
```

#### Component Measurements

| Element | Size | Color |
|---------|------|-------|
| Play button | h-8 w-8 (32px) | primary |
| Progress bar | h-1 (4px) | primary / muted |
| Progress handle | h-3 w-3 (12px) | primary |
| Time text | text-xs | muted-foreground |
| Waveform canvas | h-8 (32px) | primary/30, primary |

#### Play Button States

| State | Icon | Background |
|-------|------|-----------|
| Paused | PlayCircle | primary |
| Playing | PauseCircle | primary |
| Loading | Spinner | primary/50 |

### Implementation Requirements

**File to Create**: `src/widget/components/WidgetAudioPlayer.tsx`

```typescript
interface WidgetAudioPlayerProps {
  src: string;
  onError?: (error: Error) => void;
  className?: string;
}
```

**Dependencies ALLOWED**:
- React
- `WidgetButton` from `@/widget/ui/WidgetButton`
- Canvas API (native)
- Audio API (native)
- Icons from `@/widget/icons`

**Dependencies FORBIDDEN**:
- motion/react
- @/components/ui/button

### Canvas Waveform Implementation

Must replicate exact waveform visualization:
- Bar width: 2px
- Bar gap: 1px
- Bar color (inactive): hsl(var(--primary) / 0.3)
- Bar color (active/played): hsl(var(--primary))
- Frequency bars while playing: same colors, dynamic heights

### Acceptance Criteria

- [ ] Play/Pause button identical
- [ ] Progress bar styling matches
- [ ] Time display format matches (M:SS)
- [ ] Waveform visualization identical
- [ ] Seek functionality works
- [ ] Frequency visualization while playing
- [ ] No motion/react in bundle

---

## Phase 4: WidgetMessageReactions

### Objective
Replace `@/components/chat/MessageReactions` with widget-native emoji picker using CSS-only popover.

### Source Component Analysis

**File**: `src/components/chat/MessageReactions.tsx`

**Current Implementation Features**:
- Reaction button (smiley face icon)
- Popover with emoji grid
- Existing reactions display
- Add/remove reaction toggle
- Reaction count badges

### Visual Specifications (MUST MATCH EXACTLY)

#### Reaction Button

| State | Icon | Background |
|-------|------|-----------|
| Default | FaceSmile | transparent |
| Hover | FaceSmile | accent |
| Has Reactions | FaceSmile | accent/50 |

#### Emoji Picker Popover

```
┌─────────────────────────┐
│  😀 😂 ❤️ 👍 👎 🎉 😢 😮  │
│  🔥 ✨ 👀 🙏 💯 🤔 😍 🙌  │
└─────────────────────────┘
```

- Grid: 8 columns
- Emoji size: 24px
- Padding: p-2
- Background: popover
- Border: border
- Shadow: shadow-md
- Border radius: rounded-lg

#### Existing Reactions Display

```
┌────────────────────────────────┐
│  [😀 3] [❤️ 2] [👍 1]  [+]    │
└────────────────────────────────┘
```

- Reaction pill: rounded-full, bg-muted, px-2 py-0.5
- Count: text-xs
- User's reactions: ring-2 ring-primary

### Implementation Requirements

**Files to Create**:
1. `src/widget/components/WidgetMessageReactions.tsx`
2. `src/widget/components/WidgetEmojiPicker.tsx`

```typescript
// WidgetMessageReactions
interface WidgetMessageReactionsProps {
  messageId: string;
  reactions: Array<{
    emoji: string;
    count: number;
    userReacted: boolean;
  }>;
  onReactionToggle: (emoji: string) => void;
  disabled?: boolean;
}

// WidgetEmojiPicker
interface WidgetEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}
```

### CSS-Only Popover Implementation

Replace @radix-ui/react-popover with CSS positioning:

```css
.widget-emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  z-index: 50;
  opacity: 0;
  transform: scale(0.95) translateY(4px);
  pointer-events: none;
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.widget-emoji-picker[data-open="true"] {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}
```

Click-outside detection using:
```typescript
useEffect(() => {
  if (!isOpen) return;
  const handleClickOutside = (e: MouseEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

### Acceptance Criteria

- [ ] Emoji picker grid layout identical
- [ ] Popover positioning matches (above, right-aligned)
- [ ] Open/close animation matches
- [ ] Click outside closes picker
- [ ] Escape key closes picker
- [ ] Reaction pills styling matches
- [ ] User's own reactions highlighted
- [ ] Add/remove toggle works
- [ ] No @radix-ui/react-popover in bundle
- [ ] No motion/react in bundle

---

## Phase 5: WidgetPhoneInput

### Objective
Create lightweight phone input with basic formatting (optional - can keep libphonenumber-js if international accuracy is critical).

### Decision Point

**Option A**: Keep `libphonenumber-js/min` (~38KB)
- Pros: Perfect international formatting, accurate country detection
- Cons: 38KB bundle size

**Option B**: Create `WidgetPhoneInput` with regex (~5KB)
- Pros: 33KB smaller
- Cons: Limited to US/CA formatting, basic international support

### Recommendation

**Proceed with Option B** if 95%+ of users are US/Canada.
**Keep Option A** if significant international user base.

### Option B Implementation (If Chosen)

**File to Create**: `src/widget/components/WidgetPhoneInput.tsx`

```typescript
interface WidgetPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
  className?: string;
}
```

### US Phone Formatting Logic

```typescript
const formatUSPhone = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};
```

### Country Flag Detection (Simplified)

```typescript
const detectCountry = (phone: string): string | null => {
  if (phone.startsWith('+1') || /^\(\d{3}\)?/.test(phone)) return 'us';
  if (phone.startsWith('+44')) return 'gb';
  if (phone.startsWith('+61')) return 'au';
  if (phone.startsWith('+49')) return 'de';
  if (phone.startsWith('+33')) return 'fr';
  // Add more as needed
  return null;
};
```

### Visual Specifications (MUST MATCH EXACTLY)

- Input height: h-10 (40px)
- Flag position: left side, pl-10 on input
- Flag size: 20px width
- Flag source: `https://flagcdn.com/24x18/{country}.png`
- Placeholder: "Phone number"
- Format display: `(888) 222-4451` for US

### Acceptance Criteria

- [ ] Input styling identical to PhoneInputField
- [ ] Flag displays on left side
- [ ] US numbers format as (XXX) XXX-XXXX
- [ ] Cursor position maintained during formatting
- [ ] Focus ring matches (ring-2 ring-ring)
- [ ] No libphonenumber-js in bundle

---

## Phase 6: Update Constants & Integration

### Objective
Update `src/widget/constants.ts` to use new widget-native components.

### File Modifications

**File**: `src/widget/constants.ts`

```typescript
// BEFORE
export const VoiceInput = lazy(() => 
  import('@/components/molecule-ui/voice-input').then(m => ({ default: m.VoiceInput }))
);

// AFTER
export const VoiceInput = lazy(() => 
  import('./components/WidgetVoiceInput').then(m => ({ default: m.WidgetVoiceInput }))
);
```

### Complete Updated Exports

```typescript
import { lazy } from 'react';

// Widget-native lazy components (no heavy dependencies)
export const VoiceInput = lazy(() => 
  import('./components/WidgetVoiceInput').then(m => ({ default: m.WidgetVoiceInput }))
);

export const FileDropZone = lazy(() => 
  import('./components/WidgetFileDropZone').then(m => ({ default: m.WidgetFileDropZone }))
);

export const MessageReactions = lazy(() => 
  import('./components/WidgetMessageReactions').then(m => ({ default: m.WidgetMessageReactions }))
);

export const AudioPlayer = lazy(() => 
  import('./components/WidgetAudioPlayer').then(m => ({ default: m.WidgetAudioPlayer }))
);

// Option B only - otherwise keep original
export const PhoneInputField = lazy(() => 
  import('./components/WidgetPhoneInput').then(m => ({ default: m.WidgetPhoneInput }))
);

// Already widget-native (no changes needed)
export const DayPicker = lazy(() => 
  import('./components/booking/DayPicker').then(m => ({ default: m.DayPicker }))
);

export const TimePicker = lazy(() => 
  import('./components/booking/TimePicker').then(m => ({ default: m.TimePicker }))
);

export const BookingConfirmed = lazy(() => 
  import('./components/booking/BookingConfirmed').then(m => ({ default: m.BookingConfirmed }))
);
```

### Icon Additions Required

**File**: `src/widget/icons.tsx`

Add these icons (individual imports from @untitledui/icons):
- Microphone01
- StopCircle  
- PauseCircle
- PlayCircle
- FaceSmile
- Upload01
- File06 (or appropriate file icon)

---

## Phase 7: Testing & Verification

### Visual Regression Testing

For each component, capture screenshots of:
1. Original component in all states
2. New widget component in all states
3. Pixel-diff comparison

#### Test Scenarios per Component

**WidgetVoiceInput**:
- [ ] Idle state
- [ ] Hover state
- [ ] Recording state (with pulse animation)
- [ ] Recording with timer at various times
- [ ] Disabled state

**WidgetFileDropZone**:
- [ ] Empty drop zone
- [ ] Drag hover state
- [ ] With 1 file selected
- [ ] With multiple files selected
- [ ] File too large error
- [ ] Max files reached

**WidgetAudioPlayer**:
- [ ] Initial state (not played)
- [ ] Playing state
- [ ] Paused mid-playback
- [ ] Completed state
- [ ] Various progress positions
- [ ] Waveform rendering

**WidgetMessageReactions**:
- [ ] No reactions
- [ ] With existing reactions
- [ ] User's own reactions highlighted
- [ ] Emoji picker open
- [ ] Emoji picker hover states

**WidgetPhoneInput** (if Option B):
- [ ] Empty state
- [ ] Partial US number
- [ ] Complete US number
- [ ] International number with flag

### Functional Testing

- [ ] Voice recording creates valid audio blob
- [ ] File selection triggers callback with correct data
- [ ] Audio playback controls work (play, pause, seek)
- [ ] Emoji reactions toggle correctly
- [ ] Phone number formats correctly as typed

### Bundle Size Verification

After each phase, run:
```bash
npm run build
ls -la dist/assets/*.js | grep widget
gzip -c dist/assets/widget*.js | wc -c
```

Expected results after all phases:

| Phase | Cumulative Savings | Widget Bundle |
|-------|-------------------|---------------|
| Phase 1 | ~50KB | Reduced |
| Phase 2 | ~50KB | Reduced |
| Phase 3 | ~50KB | Reduced |
| Phase 4 | ~65KB | Reduced |
| Phase 5 | ~33KB | Reduced |
| **Total** | **~248KB** | **Minimal** |

---

## Rollback Plan

If any phase introduces bugs or visual differences:

### Immediate Rollback

1. Revert `src/widget/constants.ts` to use original imports
2. Delete the problematic widget component file
3. Redeploy

### Per-Component Rollback

Each component can be rolled back independently by changing its import in `constants.ts`:

```typescript
// Rollback VoiceInput only
export const VoiceInput = lazy(() => 
  import('@/components/molecule-ui/voice-input').then(m => ({ default: m.VoiceInput }))
);
```

### Full Rollback

Restore `constants.ts` from git:
```bash
git checkout HEAD~1 -- src/widget/constants.ts
```

---

## Files Created Checklist

### Phase 1
- [ ] `src/widget/components/WidgetVoiceInput.tsx`

### Phase 2
- [ ] `src/widget/components/WidgetFileDropZone.tsx`

### Phase 3
- [ ] `src/widget/components/WidgetAudioPlayer.tsx`

### Phase 4
- [ ] `src/widget/components/WidgetMessageReactions.tsx`
- [ ] `src/widget/components/WidgetEmojiPicker.tsx`

### Phase 5 (Optional)
- [ ] `src/widget/components/WidgetPhoneInput.tsx`

### Phase 6
- [ ] Update `src/widget/constants.ts`
- [ ] Update `src/widget/icons.tsx`

### Phase 7
- [ ] Visual regression test results documented
- [ ] Bundle size measurements recorded

---

## Approval Sign-Off

| Phase | Developer | QA | Design | Date |
|-------|-----------|-----|--------|------|
| Phase 1 | | | | |
| Phase 2 | | | | |
| Phase 3 | | | | |
| Phase 4 | | | | |
| Phase 5 | | | | |
| Phase 6 | | | | |
| Phase 7 | | | | |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-17 | AI Assistant | Initial comprehensive plan |
