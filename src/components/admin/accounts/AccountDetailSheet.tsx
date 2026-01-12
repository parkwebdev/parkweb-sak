/**
 * Account Detail Sheet Component
 * 
 * Displays detailed account information in a slide-over sheet.
 * Follows the design patterns from LeadDetailsSheet and KnowledgeDetailsSheet.
 * 
 * @module components/admin/accounts/AccountDetailSheet
 */

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAccountDetail } from '@/hooks/admin/useAccountDetail';
import { getInitials, formatAdminDate } from '@/lib/admin/admin-utils';
import { ImpersonateButton } from './ImpersonateButton';
import { Mail01, Building02, Phone01, Calendar, CreditCard01, MessageChatCircle, Users01, BookOpen01, MarkerPin01 } from '@untitledui/icons';

interface AccountDetailSheetProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  if (!amount) return '$0';
  // MRR is stored in cents
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
  const { account, usage, loading } = useAccountDetail(accountId || undefined);
  const [contentReady, setContentReady] = useState(false);

  // Defer content mounting for smooth animation
  useEffect(() => {
    if (open && account) {
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [open, account]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        {loading ? (
          <AccountDetailSkeleton />
        ) : account ? (
          <div className={contentReady ? 'animate-in fade-in duration-200' : 'opacity-0'}>
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
                    <Badge 
                      variant={account.status === 'active' ? 'default' : 'secondary'}
                      className={account.status === 'active' ? 'bg-status-active/10 text-status-active-foreground border-0' : ''}
                    >
                      {account.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {account.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6">
              {/* Contact Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail01 size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="truncate">{account.email}</span>
                  </div>
                  {account.company_name && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building02 size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                      <span className="truncate">{account.company_name}</span>
                    </div>
                  )}
                  {account.company_phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone01 size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                      <span>{account.company_phone}</span>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Account Details Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Created</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" aria-hidden="true" />
                      <span>{formatAdminDate(account.created_at)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Last Login</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" aria-hidden="true" />
                      <span>{account.last_login_at ? formatAdminDate(account.last_login_at) : 'Never'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Plan</p>
                    <div className="flex items-center gap-2">
                      <CreditCard01 size={14} className="text-muted-foreground" aria-hidden="true" />
                      <span className="capitalize">{account.plan_name || 'Free'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">MRR</p>
                    <div className="flex items-center gap-2">
                      <CreditCard01 size={14} className="text-muted-foreground" aria-hidden="true" />
                      <span className="font-medium">{formatMRR(account.mrr)}</span>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Usage Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Usage</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <MessageChatCircle size={16} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{usage?.conversations ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Conversations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <Users01 size={16} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{usage?.leads ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <BookOpen01 size={16} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{usage?.knowledgeSources ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Knowledge Sources</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <MarkerPin01 size={16} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{usage?.locations ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Locations</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Permissions Section - Only show if has permissions */}
              {account.permissions && account.permissions.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Permissions ({account.permissions.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {account.permissions.map((permission) => (
                        <span key={permission} className="text-sm text-muted-foreground">
                          • {formatPermission(permission)}
                        </span>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <Separator />

              {/* Actions Section */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                <div className="flex gap-2">
                  <ImpersonateButton 
                    userId={account.user_id}
                    userName={account.display_name}
                  />
                </div>
              </section>
            </div>
          </div>
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
 * Loading skeleton for account details
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

      {/* Contact skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      {/* Account details skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      {/* Usage skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
