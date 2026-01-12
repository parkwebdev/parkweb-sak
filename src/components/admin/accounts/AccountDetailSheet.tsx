/**
 * AccountDetailSheet Component
 * 
 * Slide-over sheet showing complete account details.
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccountDetail } from '@/hooks/admin/useAccountDetail';
import { getInitials, formatAdminDate } from '@/lib/admin/admin-utils';
import { ImpersonateButton } from './ImpersonateButton';
import { AccountActions } from './AccountActions';
import { AccountUsageCard } from './AccountUsageCard';
import { Mail01, Building02, Phone01, MarkerPin01 } from '@untitledui/icons';

interface AccountDetailSheetProps {
  accountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
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

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail01 size={16} className="text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">{account.email}</span>
                </div>
                {account.company_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building02 size={16} className="text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">{account.company_name}</span>
                  </div>
                )}
                {account.company_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MarkerPin01 size={16} className="text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">{account.company_address}</span>
                  </div>
                )}
                {account.company_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone01 size={16} className="text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">{account.company_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {formatAdminDate(account.created_at)}
                </p>
              </div>
              {account.last_login_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="text-sm font-medium">
                    {formatAdminDate(account.last_login_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <ImpersonateButton
                userId={account.user_id}
                userName={account.display_name}
              />
              <AccountActions
                account={account}
                onView={() => {}}
                onImpersonate={() => {}}
              />
            </div>

            {/* Subscription Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="text-sm font-medium">
                      {account.plan_name || 'Free'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={account.subscription_status === 'active' ? 'default' : 'secondary'}
                      className="mt-0.5"
                    >
                      {account.subscription_status || 'none'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MRR</p>
                    <p className="text-sm font-medium">
                      ${(account.mrr / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            {usage && (
              <AccountUsageCard 
                usage={{
                  conversationCount: usage.conversations,
                  leadCount: usage.leads,
                  knowledgeSourceCount: usage.knowledgeSources,
                  locationCount: usage.locations,
                }}
              />
            )}

            {/* Permissions */}
            {account.permissions && account.permissions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {account.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
