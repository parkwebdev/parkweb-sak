/**
 * Account Detail Sheet Component
 * 
 * Displays detailed account information in a slide-over sheet.
 * Features an animated gradient banner header with overlapping avatar.
 * 
 * @module components/admin/accounts/AccountDetailSheet
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { RoleBadge } from '@/components/admin/shared/RoleBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CSSBubbleBackground } from '@/components/ui/css-bubble-background';
import { useAccountDetail } from '@/hooks/admin/useAccountDetail';
import { getInitials, formatAdminDate, formatRelativeTime } from '@/lib/admin/admin-utils';

import { ImpersonateButton } from './ImpersonateButton';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { 
  Mail01, 
  Building02, 
  Phone01, 
  Calendar, 
  CreditCard01, 
  CurrencyDollar,
  MessageChatCircle, 
  Users01, 
  BookOpen01, 
  MarkerPin01,
  ChevronUp,
  Clock,
  User01,
  Shield01,
  X,
  CheckVerified01,
  RefreshCcw01,
} from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface AccountDetailSheetProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailRowProps {
  icon: typeof Mail01;
  label: string;
  value: string | number | null | undefined;
  placeholder?: string;
  href?: string;
}

// Custom banner palette - black base with blue variations (no grays)
const BANNER_COLORS = {
  first: '0,0,0',         // Black (base)
  second: '30,64,175',    // Deep blue (#1e40af)
  third: '37,99,235',     // Bright blue (#2563eb)
  fourth: '59,130,246',   // Sky blue (#3b82f6)
  fifth: '96,165,250',    // Light blue (#60a5fa)
  sixth: '14,45,120',     // Navy blue (darker variation)
};

const BANNER_GRADIENT = {
  from: '0,0,0',          // Black
  to: '30,64,175'         // Deep blue
};

/**
 * Format phone number to (XXX) XXX-XXXX
 */
function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Handle 10 or 11 digit numbers (with or without leading 1)
  const normalized = digits.length === 11 && digits.startsWith('1') 
    ? digits.slice(1) 
    : digits;
  if (normalized.length !== 10) return phone; // Return original if not valid
  return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

/**
 * Single row displaying label and value in two-column layout
 */
function DetailRow({ icon: Icon, label, value, placeholder, href }: DetailRowProps) {
  const displayValue = value ?? placeholder ?? `Set ${label.toLowerCase()}`;
  const isEmpty = !value;
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Icon size={16} className="shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      {href && !isEmpty ? (
        <a 
          href={href}
          className="text-sm text-right max-w-[200px] truncate text-primary hover:underline"
        >
          {displayValue}
        </a>
      ) : (
        <span className={cn(
          "text-sm text-right max-w-[200px] truncate",
          isEmpty ? "text-muted-foreground" : "text-foreground"
        )}>
          {displayValue}
        </span>
      )}
    </div>
  );
}

/**
 * Format permission enum to readable text
 */
function formatPermission(permission: string): string {
  return permission
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format currency for MRR display
 */
function formatMRR(amount: number | undefined): string {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

/**
 * Sheet component showing complete account details.
 */
export function AccountDetailSheet({
  accountId,
  open,
  onOpenChange,
}: AccountDetailSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const { account, usage, loading } = useAccountDetail(accountId || undefined);
  const [contentReady, setContentReady] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Defer content mounting for smooth animation
  useEffect(() => {
    if (open && account) {
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
      setShowMore(false);
    }
  }, [open, account]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-0">
        <VisuallyHidden.Root>
          <SheetTitle>Account Details</SheetTitle>
        </VisuallyHidden.Root>
        {loading ? (
          <AccountDetailSkeleton />
        ) : account ? (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={contentReady ? { opacity: 1 } : { opacity: 0 }}
            transition={springs.smooth}
          >
            {/* Animated Banner Header */}
            <div className="relative h-36 overflow-hidden">
              <CSSBubbleBackground
                colors={BANNER_COLORS}
                baseGradient={BANNER_GRADIENT}
                className="absolute inset-0"
              />
              
              {/* Close button */}
              <button 
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Avatar - overlapping the banner */}
            <div className="relative px-5 -mt-10">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={account.avatar_url || undefined} alt={account.display_name || 'User'} />
                <AvatarFallback className="text-xl bg-muted">
                  {getInitials(account.display_name || account.email)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Role */}
            <div className="px-5 pt-3 pb-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold truncate">
                  {account.display_name || 'Unnamed Account'}
                </h2>
                <RoleBadge role={account.role} />
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 space-y-1">
              {/* Account Details Section */}
              <div className="space-y-0">
                <DetailRow 
                  icon={Mail01} 
                  label="Email" 
                  value={account.email}
                  href={account.email ? `mailto:${account.email}` : undefined}
                />
                <DetailRow 
                  icon={Phone01} 
                  label="Phone" 
                  value={formatPhoneNumber(account.company_phone)} 
                  placeholder="Not set"
                  href={account.company_phone ? `tel:${account.company_phone.replace(/\D/g, '')}` : undefined}
                />
                <DetailRow 
                  icon={Building02} 
                  label="Company" 
                  value={account.company_name} 
                  placeholder="Not set"
                />
                <DetailRow 
                  icon={User01} 
                  label="Name" 
                  value={account.display_name} 
                  placeholder="Not set"
                />
                <DetailRow 
                  icon={Calendar} 
                  label="Date created" 
                  value={formatAdminDate(account.created_at)} 
                />
                <DetailRow 
                  icon={Clock} 
                  label="Last interaction" 
                  value={account.last_login_at ? formatRelativeTime(account.last_login_at) : 'Never'} 
                />
                <DetailRow 
                  icon={CreditCard01} 
                  label="Plan" 
                  value={account.plan_name || 'Free'} 
                />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <User01 size={16} className="shrink-0" aria-hidden="true" />
                    <span>Profile status</span>
                  </div>
                  <StatusBadge status={account.status} type="account" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <RefreshCcw01 size={16} className="shrink-0" aria-hidden="true" />
                    <span>Subscription</span>
                  </div>
                  {account.subscription_status ? (
                    <StatusBadge status={account.subscription_status} type="subscription" />
                  ) : (
                    <span className="text-sm text-muted-foreground">No subscription</span>
                  )}
                </div>
                <DetailRow 
                  icon={CurrencyDollar} 
                  label="MRR" 
                  value={formatMRR(account.mrr)} 
                />
              </div>

              {/* Collapsible additional details */}
              <Collapsible open={showMore} onOpenChange={setShowMore}>
                <CollapsibleContent className="space-y-0">
                  
                  <Separator className="my-3" />
                  
                  {/* Usage Stats */}
                  <DetailRow 
                    icon={MessageChatCircle} 
                    label="Conversations" 
                    value={usage?.conversations ?? 0} 
                  />
                  <DetailRow 
                    icon={Users01} 
                    label="Leads" 
                    value={usage?.leads ?? 0} 
                  />
                  <DetailRow 
                    icon={BookOpen01} 
                    label="Knowledge Sources" 
                    value={usage?.knowledgeSources ?? 0} 
                  />
                  <DetailRow 
                    icon={MarkerPin01} 
                    label="Locations" 
                    value={usage?.locations ?? 0} 
                  />

                  {/* Permissions Section */}
                  {account.permissions && account.permissions.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="py-2">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          <Shield01 size={16} className="shrink-0" aria-hidden="true" />
                          <span>Permissions ({account.permissions.length})</span>
                        </div>
                        <div className="pl-7 space-y-1">
                          {account.permissions.map((permission) => (
                            <span key={permission} className="text-sm text-muted-foreground block">
                              • {formatPermission(permission)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CollapsibleContent>

                <CollapsibleTrigger asChild>
                  <button 
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 w-full"
                  >
                    <span>{showMore ? 'See less' : 'See more'}</span>
                    <ChevronUp 
                      size={14} 
                      className={cn(
                        "transition-transform duration-200",
                        showMore ? "rotate-0" : "rotate-180"
                      )} 
                      aria-hidden="true" 
                    />
                  </button>
                </CollapsibleTrigger>
              </Collapsible>

              <Separator className="my-3" />

              {/* Actions */}
              <div className="pt-2">
                <ImpersonateButton 
                  userId={account.user_id}
                  userName={account.display_name}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Account not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Loading skeleton for account details - matches banner layout
 */
function AccountDetailSkeleton() {
  return (
    <div>
      {/* Banner skeleton */}
      <Skeleton className="h-36 w-full rounded-none" />
      
      {/* Overlapping avatar skeleton */}
      <div className="px-5 -mt-10">
        <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
      </div>
      
      {/* Name and role skeleton */}
      <div className="px-5 pt-3 pb-4 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-16" />
      </div>
      
      {/* Detail row skeletons - match actual count (12 rows) */}
      <div className="px-5 space-y-0">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      
      {/* See more button skeleton */}
      <div className="px-5 py-2">
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Separator */}
      <div className="px-5 my-3">
        <Skeleton className="h-px w-full" />
      </div>
      
      {/* Action button skeleton */}
      <div className="px-5 pt-2 pb-5">
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
