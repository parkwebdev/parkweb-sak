# Layout Requirements and Standards

## Sidebar Consistency

**CRITICAL**: Every page in the application MUST use the consistent sidebar layout pattern to ensure proper navigation and user experience.

### Required Pattern

All pages must follow this structure:

```tsx
// Page Wrapper (e.g., ClientsWrapper.tsx)
import React, { useState } from 'react';
import { YourPageComponent } from './YourPageComponent';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';

const YourPageWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <YourPageComponent onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};

export default YourPageWrapper;
```

### Page Content Structure

Your page content should follow this header pattern:

```tsx
interface YourPageProps {
  onMenuClick?: () => void;
}

export const YourPage: React.FC<YourPageProps> = ({ onMenuClick }) => {
  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Page Title</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Page description
                </p>
              </div>
            </div>
            
            {/* Page actions */}
          </div>
        </div>
      </header>

      {/* Page content */}
    </main>
  );
};
```

### Routing Configuration

Update `App.tsx` to use the wrapper component:

```tsx
import YourPageWrapper from "./pages/YourPageWrapper";

// In routes
<Route path="/your-page" element={<YourPageWrapper />} />
```

### Key Requirements

1. **Wrapper Pattern**: Always create a `PageWrapper.tsx` component that handles sidebar layout
2. **Mobile Menu**: Include the mobile menu button with `onMenuClick` prop
3. **Responsive Margins**: Use the proper `lg:ml-[72px]` and `lg:ml-[280px]` classes for collapsed/expanded states
4. **Consistent Header**: Follow the established header structure with proper spacing and typography
5. **Z-Index Management**: Maintain proper layering with sidebar at `z-30` and overlay at `z-20`

### Examples in Codebase

- `DashboardWrapper.tsx` - Original pattern
- `Requests.tsx` - Simplified inline pattern 
- `ClientsWrapper.tsx` - Full CRM implementation with folder navigation

### Migration Checklist

When creating or updating pages:

- [ ] Create wrapper component following the pattern
- [ ] Implement mobile menu button
- [ ] Update routing to use wrapper
- [ ] Test sidebar collapse/expand functionality
- [ ] Verify mobile responsiveness
- [ ] Ensure proper z-index layering

## Design System Compliance

All pages must also follow the established design system:

- Use semantic tokens from `index.css` and `tailwind.config.ts`
- Maintain consistent spacing with `px-4 lg:px-8` and `pt-4 lg:pt-8`
- Follow typography hierarchy with proper heading sizes
- Use established color tokens (avoid hardcoded colors)