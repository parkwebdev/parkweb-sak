/**
 * AccountDetailSheet Component
 * 
 * Slide-over sheet showing account details.
 * 
 * @module components/admin/accounts/AccountDetailSheet
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAccountDetail } from '@/hooks/admin/useAccountDetail';
import { getInitials, formatAdminDate } from '@/lib/admin/admin-utils';
import { ImpersonateButton } from './ImpersonateButton';
import { AccountActions } from './AccountActions';
import { AccountUsageCard } from './AccountUsageCard';

interface AccountDetailSheetProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet component showing account details.
 */
export function AccountDetailSheet({
  accountId,
  open,
  onOpenChange,
}: AccountDetailSheetProps) {
  const { account, usage, loading } = useAccountDetail(accountId || undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Account Details</SheetTitle>
          <SheetDescription>
            View and manage account information
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <AccountDetailSkeleton />
        ) : account ? (
          <div className="mt-6 space-y-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={account.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(account.display_name || account.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  {account.display_name || 'No name'}
                </h3>
                <p className="text-sm text-muted-foreground">{account.email}</p>
                {account.company_name && (
                  <p className="text-sm text-muted-foreground">
                    {account.company_name}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge
                    variant={account.status === 'active' ? 'default' : 'destructive'}
                  >
                    {account.status}
                  </Badge>
                  <Badge variant="outline">{account.role}</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <ImpersonateButton
                userId={account.user_id}
                userName={account.display_name}
              />
              <AccountActions
                accountId={account.user_id}
                status={account.status}
              />
            </div>

            {/* Account Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-sm font-medium">
                  {account.plan_name || 'Free'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MRR</p>
                <p className="text-sm font-medium">
                  ${account.mrr.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {formatAdminDate(account.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">{account.role}</p>
              </div>
            </div>

            {/* Usage Stats */}
            {usage && (
              <AccountUsageCard 
                usage={{
                  agentCount: usage.agents,
                  conversationCount: usage.conversations,
                  leadCount: usage.leads,
                  knowledgeSourceCount: usage.knowledgeSources,
                  locationCount: usage.locations,
                }}
              />
            )}
          </div>
        ) : (
          <div className="mt-6 text-center py-8">
            <p className="text-sm text-muted-foreground">Account not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
