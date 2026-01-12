/**
 * Admin Account Detail Page
 * 
 * Detailed view of a specific user account.
 * Shows usage, subscription, conversations, and provides impersonation.
 * 
 * @module pages/admin/AdminAccountDetail
 */

import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mail01, Building02, Phone01 } from '@untitledui/icons';
import { AccountUsageCard, ImpersonateButton, AccountStatusBadge } from '@/components/admin/accounts';
import { useAccountDetail } from '@/hooks/admin';
import { getInitials } from '@/lib/admin/admin-utils';
import { format } from 'date-fns';

/**
 * Individual account detail page for Super Admin.
 */
export function AdminAccountDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { account, usage, loading, error } = useAccountDetail(userId);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load account: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/admin/accounts" 
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft size={20} className="text-muted-foreground" aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Account Details</h1>
          {loading ? (
            <Skeleton className="h-4 w-48 mt-1" />
          ) : (
            <p className="text-sm text-muted-foreground">{account?.email}</p>
          )}
        </div>
        {account && (
          <ImpersonateButton 
            userId={account.user_id}
            userName={account.display_name}
          />
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      ) : account ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={account.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">
                      {getInitials(account.display_name || account.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {account.display_name || 'No name'}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <AccountStatusBadge status={account.status} />
                      <Badge variant="outline">{account.role}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail01 size={14} className="text-muted-foreground" aria-hidden="true" />
                    <span className="text-muted-foreground">{account.email}</span>
                  </div>
                  {account.company_name && (
                    <div className="flex items-center gap-2">
                      <Building02 size={14} className="text-muted-foreground" aria-hidden="true" />
                      <span className="text-muted-foreground">{account.company_name}</span>
                    </div>
                  )}
                  {account.company_phone && (
                    <div className="flex items-center gap-2">
                      <Phone01 size={14} className="text-muted-foreground" aria-hidden="true" />
                      <span className="text-muted-foreground">{account.company_phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                  <p>Created: {format(new Date(account.created_at), 'PPP')}</p>
                  {account.last_login_at && (
                    <p className="mt-1">
                      Last login: {format(new Date(account.last_login_at), 'PPP')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subscription</CardTitle>
                <CardDescription>Current plan and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plan</p>
                    <p className="font-medium">{account.plan_name || 'Free'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={account.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {account.subscription_status || 'None'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MRR</p>
                    <p className="font-medium font-mono">${(account.mrr / 100).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            {/* Permissions */}
            {account.permissions && account.permissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {account.permissions.map((perm) => (
                      <Badge key={perm} variant="outline">{perm}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Account not found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
