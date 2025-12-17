# Widget Lazy Component Optimization Plan

> **CRITICAL REQUIREMENT**: All optimized components MUST be pixel-perfect visual matches to their original counterparts. NO visual changes are permitted. Only internal implementation changes to remove heavy dependencies.

## Executive Summary

This document outlines a phased approach to optimize lazy-loaded widget components by replacing heavy dependencies (motion/react, @radix-ui/*, libphonenumber-js) with lightweight CSS-based alternatives while maintaining **100% visual and functional parity**.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Phase 1: WidgetVoiceInput](#phase-1-widgetvoiceinput)
3. [Phase 2: WidgetFileDropZone & WidgetFileAttachment](#phase-2-widgetfiledropzone--widgetfileattachment)
4. [Phase 3: WidgetAudioPlayer](#phase-3-widgetaudioplayer)
5. [Phase 4: WidgetMessageReactions & WidgetEmojiPicker](#phase-4-widgetmessagereactions--widgetemojipicker)
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
| FileDropZone | `@/components/chat/FileDropZone` | @/components/ui/button (motion), FileAttachment | ~50KB gzipped |
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
└── @/components/chat/FileAttachment ⚠️ ALSO HAS HEAVY DEPS
    ├── @/components/ui/button
    │   └── motion/react
    ├── X icon from @untitledui/icons
    └── Download01 icon from @untitledui/icons

MessageReactions
├── @radix-ui/react-popover (~15KB)
├── motion/react (~50KB)
└── EmojiPicker component ⚠️ ALSO HAS HEAVY DEPS
    ├── @/components/ui/button (~motion/react)
    ├── @radix-ui/react-scroll-area (~12KB)
    └── @radix-ui/react-tabs (~10KB)

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
- Icons from `@/widget/icons` (Microphone01, StopCircle, XClose)

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

## Phase 2: WidgetFileDropZone & WidgetFileAttachment

### Objective
Replace `@/components/chat/FileDropZone` AND its dependency `@/components/chat/FileAttachment` with widget-native versions.

> **CRITICAL**: FileDropZone imports FileAttachment which ALSO uses @/components/ui/button. Both must be replaced.

### Source Component Analysis

**Files**: 
- `src/components/chat/FileDropZone.tsx`
- `src/components/chat/FileAttachment.tsx`

**FileDropZone Implementation Features**:
- Drag-and-drop zone with dashed border
- File input trigger
- Selected files preview list (uses FileAttachment)
- Remove file button per item
- Cancel and Attach action buttons
- Drag hover visual feedback

**FileAttachment Implementation Features**:
- Image preview with thumbnail
- Non-image file with icon display
- Remove button (X icon, destructive variant for images, ghost for files)
- File name and size display
- Download button variant (MessageFileAttachment)

### Visual Specifications (MUST MATCH EXACTLY)

#### Drop Zone States

| State | Border | Background | Text |
|-------|--------|-----------|------|
| Default | border-dashed border-2 border-muted-foreground/25 | transparent | "Drag files here or click to browse" |
| Drag Over | border-dashed border-2 border-primary | primary/5 | "Drop files here" |
| Has Files | border-solid border border-border | card | File list |

#### FileAttachment - Image Preview

```
┌────────────────────────────────────┐
│  ┌──────────────────────┐   [X]   │
│  │                      │         │
│  │   [image preview]    │         │
│  │      128x128px       │         │
│  │                      │         │
│  └──────────────────────┘         │
│  filename.jpg                      │
└────────────────────────────────────┘
```

- Container: relative group, w-32 h-32, rounded-lg, overflow-hidden, border
- Image: w-full h-full object-cover
- Remove button: absolute top-1 right-1, h-6 w-6 p-0, destructive variant
- Remove button visibility: opacity-0 group-hover:opacity-100 transition-opacity
- Filename: absolute bottom-0, bg-black/70, text-white, p-1 text-xs truncate

#### FileAttachment - Non-Image File Preview

```
┌─────────────────────────────────────────────┐
│  [📄]  filename.pdf              [X Remove] │
│        1.2 MB                               │
└─────────────────────────────────────────────┘
```

- Container: relative flex items-center gap-3 p-3 border rounded-lg bg-background
- Icon: FileTypeIcon component, 40x40
- Filename: text-sm font-medium truncate
- Size: text-xs text-muted-foreground
- Remove: ghost button, h-6 w-6 p-0, X icon h-3 w-3

#### Action Buttons

```
┌─────────────────────────────────────────────┐
│              [Cancel]  [Attach X files]     │
└─────────────────────────────────────────────┘
```

- Cancel: variant="ghost"
- Attach: variant="default", shows file count

### Implementation Requirements

**Files to Create**: 
1. `src/widget/components/WidgetFileDropZone.tsx`
2. `src/widget/components/WidgetFileAttachment.tsx`

```typescript
// WidgetFileDropZone
interface WidgetFileDropZoneProps {
  onFilesSelected: (files: File[], urls: string[]) => void;
  onCancel: () => void;
  primaryColor?: string;
  maxFiles?: number; // default 5
  maxSizeBytes?: number; // default 10MB
}

// WidgetFileAttachment
interface WidgetFileAttachmentProps {
  file: File;
  fileUrl: string;
  onRemove: () => void;
  primaryColor: string;
}

// WidgetMessageFileAttachment (for displaying in messages)
interface WidgetMessageFileAttachmentProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  primaryColor: string;
}
```

**Dependencies ALLOWED**:
- React
- `WidgetButton` from `@/widget/ui/WidgetButton`
- `@/lib/file-validation` (existing - isImageFile, formatFileSize)
- `@/lib/file-download` (existing - downloadFile)
- `@/components/chat/FileTypeIcons` (existing - no heavy deps, just SVGs)
- Icons from `@/widget/icons` (X, XClose, Download01, Upload01)

**Dependencies FORBIDDEN**:
- motion/react
- @/components/ui/button
- @/components/chat/FileAttachment (the original)

### Acceptance Criteria

- [ ] Drop zone border style matches exactly
- [ ] Drag hover feedback matches
- [ ] Image preview layout identical (128x128, rounded corners)
- [ ] Non-image file preview layout identical
- [ ] Remove button positioning matches (top-right for images, inline for files)
- [ ] Remove button hover reveal effect works (images only)
- [ ] File type icons display correctly
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
- `WidgetSpinner` from `@/widget/ui/WidgetSpinner`
- Canvas API (native)
- Audio API (native)
- Icons from `@/widget/icons` (PlayCircle, PauseCircle)

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

## Phase 4: WidgetMessageReactions & WidgetEmojiPicker

### Objective
Replace `@/components/chat/MessageReactions` with widget-native emoji picker using CSS-only popover, tabs, and scroll area.

> **CRITICAL**: EmojiPicker uses THREE Radix components that must be replaced:
> 1. `@/components/ui/button` (motion/react)
> 2. `@radix-ui/react-scroll-area` (~12KB)
> 3. `@radix-ui/react-tabs` (~10KB)

### Source Component Analysis

**Files**:
- `src/components/chat/MessageReactions.tsx`
- `src/components/chat/EmojiPicker.tsx`

**MessageReactions Features**:
- Reaction button (smiley face icon)
- Popover with emoji grid
- Existing reactions display
- Add/remove reaction toggle
- Reaction count badges

**EmojiPicker Features**:
- Tabbed interface with 8 categories (smileys, gestures, hearts, animals, food, activities, travel, objects)
- Category tabs with emoji labels (😊, 👍, ❤️, 🐶, 🍕, ⚽, ✈️, 💡)
- Scrollable emoji grid per category (8 columns)
- 50+ emojis per category
- Hover scale effect on emojis

### Visual Specifications (MUST MATCH EXACTLY)

#### Reaction Button

| State | Icon | Background |
|-------|------|-----------|
| Default | FaceSmile | transparent |
| Hover | FaceSmile | accent |
| Has Reactions | FaceSmile | accent/50 |

#### EmojiPicker Full Component

```
┌─────────────────────────────────────────────────┐
│  [😊] [👍] [❤️] [🐶] [🍕] [⚽] [✈️] [💡]       │  ← Tab bar h-12
├─────────────────────────────────────────────────┤
│  😀 😃 😄 😁 😅 😂 🤣 😊                       │
│  😇 🙂 🙃 😉 😌 😍 🥰 😘                       │
│  😗 😙 😚 😋 😛 😝 😜 🤪                       │  ← Scrollable area h-[280px]
│  🤨 🧐 🤓 😎 🥳 😏 😒 😞                       │
│  😔 😟 😕 🙁 😣 😖 😫 😩                       │
│  ...                                            │
└─────────────────────────────────────────────────┘
Width: 320px
```

#### Tab Bar Specifications

| Property | Value |
|----------|-------|
| Container | w-full grid grid-cols-8 h-12 bg-muted/50 |
| Tab button | text-xl, centered |
| Active tab | bg-background, border-bottom 2px solid primaryColor |
| Tab content area | mt-0 |

#### Scroll Area Specifications

| Property | Value |
|----------|-------|
| Container | h-[280px] p-2 |
| Grid | grid-cols-8 gap-1 |
| Emoji button | h-10 w-10 p-0 text-2xl |
| Hover effect | scale-125 transition-transform |

#### Existing Reactions Display

```
┌────────────────────────────────────┐
│  [😀 3] [❤️ 2] [👍 1]  [+]        │
└────────────────────────────────────┘
```

- Reaction pill: rounded-full, bg-muted, px-2 py-0.5
- Count: text-xs
- User's reactions: ring-2 ring-primary
- Add button: Plus icon

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
  primaryColor: string;
}
```

### CSS-Only Replacements

#### 1. Popover Replacement (CSS positioning)

```css
.widget-emoji-popover-container {
  position: relative;
}

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

#### 2. Tabs Replacement (CSS + React state)

```typescript
// State-driven tabs (no Radix)
const [activeTab, setActiveTab] = useState('smileys');

// Tab bar - native buttons with conditional styling
<div className="w-full grid grid-cols-8 h-12 bg-muted/50">
  {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
    <button
      key={key}
      type="button"
      onClick={() => setActiveTab(key)}
      className={cn(
        "text-xl flex items-center justify-center transition-colors",
        activeTab === key && "bg-background"
      )}
      style={activeTab === key ? { borderBottom: `2px solid ${primaryColor}` } : {}}
    >
      {category.label}
    </button>
  ))}
</div>

// Tab content - conditional rendering
{Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
  activeTab === key && (
    <div key={key} className="h-[280px] overflow-y-auto p-2">
      {/* emoji grid */}
    </div>
  )
))}
```

#### 3. ScrollArea Replacement (native CSS)

```css
.widget-emoji-scroll {
  height: 280px;
  overflow-y: auto;
  padding: 8px;
  
  /* Custom scrollbar styling to match Radix */
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
}

.widget-emoji-scroll::-webkit-scrollbar {
  width: 8px;
}

.widget-emoji-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.widget-emoji-scroll::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

.widget-emoji-scroll::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
```

### Click-Outside & Keyboard Handling

```typescript
// Click outside detection
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

// Escape key handling
useEffect(() => {
  if (!isOpen) return;
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen]);
```

**Dependencies ALLOWED**:
- React (useState, useEffect, useRef)
- `WidgetButton` from `@/widget/ui/WidgetButton`
- Icons from `@/widget/icons` (FaceSmile, Plus)
- cn() utility from `@/lib/utils`

**Dependencies FORBIDDEN**:
- motion/react
- @radix-ui/react-popover
- @radix-ui/react-scroll-area
- @radix-ui/react-tabs
- @/components/ui/button
- @/components/ui/scroll-area
- @/components/ui/tabs

### Acceptance Criteria

- [ ] Emoji picker container is exactly 320px wide
- [ ] Tab bar is exactly 12 units (48px) tall with 8 equal columns
- [ ] Active tab has bg-background and 2px bottom border in primaryColor
- [ ] Scroll area is exactly 280px tall with matching scrollbar
- [ ] Emoji grid is 8 columns with 1 unit (4px) gap
- [ ] Emoji buttons are h-10 w-10 (40px) with text-2xl
- [ ] Emoji hover scales to 125%
- [ ] Popover positioning matches (above, right-aligned)
- [ ] Open/close animation matches (150ms, scale + opacity)
- [ ] Click outside closes picker
- [ ] Escape key closes picker
- [ ] Reaction pills styling matches
- [ ] User's own reactions highlighted with ring-2
- [ ] Add/remove toggle works
- [ ] No @radix-ui/* in bundle
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

#### Current Icons (already present)
```typescript
// Navigation & UI
X, XClose, ChevronRight, ChevronLeft

// Messaging
Send01, MessageChatCircle

// Media & Files
Microphone01, Attachment01, VolumeMax, VolumeX, Download01

// Feedback
ThumbsUp, ThumbsDown, CheckCircle, Check, XCircle

// Actions & Features
Phone01, MarkerPin01, Calendar, Star01, BookOpen01, Zap
```

#### Icons to ADD
```typescript
// Voice Recording (Phase 1)
import { StopCircle } from '@untitledui/icons/StopCircle';

// Audio Player (Phase 3)
import { PlayCircle } from '@untitledui/icons/PlayCircle';
import { PauseCircle } from '@untitledui/icons/PauseCircle';

// Message Reactions (Phase 4)
import { FaceSmile } from '@untitledui/icons/FaceSmile';
import { Plus } from '@untitledui/icons/Plus';

// File Upload (Phase 2)
import { Upload01 } from '@untitledui/icons/Upload01';
```

#### Complete Updated icons.tsx exports

```typescript
export {
  // Navigation & UI
  X,
  XClose,
  ChevronRight,
  ChevronLeft,
  
  // Messaging
  Send01,
  MessageChatCircle,
  
  // Media & Files
  Microphone01,
  Attachment01,
  VolumeMax,
  VolumeX,
  Download01,
  Upload01,        // NEW - Phase 2
  
  // Audio Player
  PlayCircle,      // NEW - Phase 3
  PauseCircle,     // NEW - Phase 3
  StopCircle,      // NEW - Phase 1
  
  // Feedback
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Check,
  XCircle,
  
  // Reactions
  FaceSmile,       // NEW - Phase 4
  Plus,            // NEW - Phase 4
  
  // Actions & Features
  Phone01,
  MarkerPin01,
  Calendar,
  Star01,
  BookOpen01,
  Zap,
};
```

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
- [ ] With 1 image file selected (thumbnail preview)
- [ ] With 1 non-image file selected (icon preview)
- [ ] With multiple files selected
- [ ] File too large error
- [ ] Max files reached

**WidgetFileAttachment** (both variants):
- [ ] Image attachment (128x128 preview)
- [ ] Image attachment hover (remove button visible)
- [ ] Non-image attachment (file icon + details)
- [ ] Message attachment with download button

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
- [ ] Add reaction button

**WidgetEmojiPicker**:
- [ ] Picker closed state
- [ ] Picker open with first tab
- [ ] Each of 8 category tabs active
- [ ] Scroll position within tab
- [ ] Emoji hover state (scale effect)
- [ ] Custom scrollbar visibility

**WidgetPhoneInput** (if Option B):
- [ ] Empty state
- [ ] Partial US number
- [ ] Complete US number with flag
- [ ] International number with flag

### Functional Testing

- [ ] Voice recording creates valid audio blob
- [ ] Voice recording cancel works
- [ ] File drag-and-drop triggers callback
- [ ] File click-to-browse triggers callback
- [ ] File remove button works (images and non-images)
- [ ] Audio playback controls work (play, pause, seek)
- [ ] Audio waveform renders correctly
- [ ] Emoji picker opens/closes
- [ ] Tab switching works in emoji picker
- [ ] Scroll works in emoji picker
- [ ] Emoji selection triggers callback
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

| Phase | Component | Cumulative Savings |
|-------|-----------|-------------------|
| Phase 1 | WidgetVoiceInput | ~50KB |
| Phase 2 | WidgetFileDropZone + WidgetFileAttachment | ~50KB |
| Phase 3 | WidgetAudioPlayer | ~50KB |
| Phase 4 | WidgetMessageReactions + WidgetEmojiPicker | ~65KB (includes Radix tabs/scroll) |
| Phase 5 | WidgetPhoneInput | ~33KB |
| **Total** | | **~248KB** |

---

## Rollback Plan

If any phase introduces bugs or visual differences:

### Immediate Rollback

1. Revert `src/widget/constants.ts` to use original imports
2. Delete the problematic widget component file(s)
3. Redeploy

### Per-Component Rollback

Each component can be rolled back independently by changing its import in `constants.ts`:

```typescript
// Rollback VoiceInput only
export const VoiceInput = lazy(() => 
  import('@/components/molecule-ui/voice-input').then(m => ({ default: m.VoiceInput }))
);

// Rollback FileDropZone only (note: also requires FileAttachment rollback in its imports)
export const FileDropZone = lazy(() => 
  import('@/components/chat/FileDropZone').then(m => ({ default: m.FileDropZone }))
);

// Rollback MessageReactions only (note: also requires EmojiPicker rollback in its imports)
export const MessageReactions = lazy(() => 
  import('@/components/chat/MessageReactions').then(m => ({ default: m.MessageReactions }))
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
- [ ] `src/widget/components/WidgetFileAttachment.tsx`

### Phase 3
- [ ] `src/widget/components/WidgetAudioPlayer.tsx`

### Phase 4
- [ ] `src/widget/components/WidgetMessageReactions.tsx`
- [ ] `src/widget/components/WidgetEmojiPicker.tsx`

### Phase 5 (Optional)
- [ ] `src/widget/components/WidgetPhoneInput.tsx`

### Phase 6
- [ ] Update `src/widget/constants.ts`
- [ ] Update `src/widget/icons.tsx` (add 6 new icons)

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
| 1.1 | 2025-12-17 | AI Assistant | Fixed 3 critical gaps: Added WidgetFileAttachment requirement, detailed EmojiPicker Radix replacements (Tabs, ScrollArea, Button), corrected icons inventory with 6 missing icons |
