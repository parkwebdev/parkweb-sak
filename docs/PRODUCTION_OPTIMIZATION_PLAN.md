# Production Optimization Plan

> **Last Updated**: December 2024  
> **Status**: 2 Pending Items

---

## Phase 8: TODO Resolution (PENDING)

**Priority**: 🟡 MEDIUM  
**Estimated Time**: 1 hour

### Video Modal Implementation

**Files**:
- `src/components/onboarding/VideoPlaceholder.tsx` - Line 47
- `src/components/onboarding/SetupChecklist.tsx` - Line 181
- `src/components/onboarding/NextLevelVideoSection.tsx` - Line 48

**Solution**: Create `src/components/onboarding/VideoModal.tsx` component and wire it up.

### Planner Calendar Database Connection

**File**: `src/pages/Planner.tsx` - Line 76

**Current Behavior**: Creates local events that don't persist.

**Solution**: Connect to existing `useCalendarEvents` hook or show informative message.

---

## Phase 9: Widget Component Refactor (OPTIONAL)

**Priority**: 🟢 LOW  
**Status**: DEFERRED

`ChatWidget.tsx` (949 lines) has already been significantly refactored with ~630 lines extracted to hooks. Further refactoring is optional.

**If needed in future**, consider extracting:
- `useWidgetMessaging` - handleSendMessage logic
- `useWidgetRecording` - Audio recording logic
- `WidgetContent.tsx` - View switching JSX
