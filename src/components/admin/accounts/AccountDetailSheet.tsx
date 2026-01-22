/**
 * Account Detail Sheet Component
 * 
 * Displays detailed account information in a slide-over sheet.
 * Uses a clean two-column row-based layout with collapsible sections.
 * 
 * @module components/admin/accounts/AccountDetailSheet
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
  MessageChatCircle, 
  Users01, 
  BookOpen01, 
  MarkerPin01,
  ChevronUp,
  Clock,
  User01,
  Shield01
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
}

/**
 * Single row displaying label and value in two-column layout
 */
function DetailRow({ icon: Icon, label, value, placeholder }: DetailRowProps) {
  const displayValue = value ?? placeholder ?? `Set ${label.toLowerCase()}`;
  const isEmpty = !value;
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Icon size={16} className="shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <span className={cn(
        "text-sm text-right max-w-[200px] truncate",
        isEmpty ? "text-muted-foreground" : "text-foreground"
      )}>
        {displayValue}
      </span>
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
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        {loading ? (
          <AccountDetailSkeleton />
        ) : account ? (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={contentReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={springs.smooth}
          >
            {/* Header: Avatar + Name + Badges */}
            <SheetHeader className="mb-6">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={account.avatar_url || undefined} alt={account.display_name || 'User'} />
                  <AvatarFallback className="text-base">
                    {getInitials(account.display_name || account.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="truncate text-lg">
                    {account.display_name || 'Unnamed Account'}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusBadge status={account.status} type="account" />
                    <RoleBadge role={account.role} />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-1">
              {/* Account Details Section */}
              <div className="space-y-0">
                <DetailRow 
                  icon={Mail01} 
                  label="Email" 
                  value={account.email} 
                />
                <DetailRow 
                  icon={Phone01} 
                  label="Phone" 
                  value={account.company_phone} 
                  placeholder="Not set"
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
              </div>

              {/* Collapsible additional details */}
              <Collapsible open={showMore} onOpenChange={setShowMore}>
                <CollapsibleContent className="space-y-0">
                  <DetailRow 
                    icon={CreditCard01} 
                    label="Plan" 
                    value={account.plan_name || 'Free'} 
                  />
                  <DetailRow 
                    icon={CreditCard01} 
                    label="MRR" 
                    value={formatMRR(account.mrr)} 
                  />
                  
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
 * Loading skeleton for account details - matches new row layout
 */
function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>

      {/* Row skeletons */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* See more skeleton */}
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
