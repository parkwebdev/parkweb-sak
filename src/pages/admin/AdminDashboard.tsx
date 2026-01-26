/**
 * Admin Dashboard Page
 * 
 * Overview page for the Super Admin Dashboard.
 * Shows key platform metrics and quick actions.
 * 
 * @module pages/admin/AdminDashboard
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Users01, 
  CreditCard01, 
  MessageChatSquare, 
  TrendUp01,
  ChevronRight,
  FileCode01,
  Users02,
  BookOpen01,
  Mail01,
  ClipboardCheck,
  LayoutAlt01,
} from '@untitledui/icons';
import { useAdminAccountsCount } from '@/hooks/admin/useAdminAccountsCount';
import { useRevenueAnalytics } from '@/hooks/admin/useRevenueAnalytics';
import { useAdminSubscriptionsCount } from '@/hooks/admin/useAdminSubscriptionsCount';
import { formatAdminCurrency, formatCompactNumber, formatPercentage } from '@/lib/admin/admin-utils';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  description: string;
  loading?: boolean;
  trend?: 'up' | 'down' | null;
}

/**
 * Stat card component for dashboard KPIs.
 */
function StatCard({ icon: Icon, label, value, description, loading, trend }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Icon size={20} className="text-muted-foreground" aria-hidden="true" />
          </div>
          {trend === 'up' && (
            <TrendUp01 size={16} className="text-status-active ml-auto" aria-hidden="true" />
          )}
          {trend === 'down' && (
            <TrendUp01 size={16} className="text-destructive ml-auto rotate-180" aria-hidden="true" />
          )}
        </div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
  href: string;
}

/**
 * Quick action card for navigation.
 */
function QuickActionCard({ icon: Icon, label, description, href }: QuickActionCardProps) {
  return (
    <Link to={href}>
      <Card className="group cursor-pointer hover:border-primary/50 transition-colors">
        <CardContent className="pt-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon size={20} className="text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight 
            size={16} 
            className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" 
            aria-hidden="true" 
          />
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Super Admin Dashboard overview page.
 */
export function AdminDashboard() {
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={LayoutAlt01} title="Platform Overview" />,
  }), []);
  useTopBar(topBarConfig);

  // Fetch data using lightweight count hooks
  const { count: accountCount, loading: accountsLoading } = useAdminAccountsCount();
  const { data: revenueData, loading: revenueLoading } = useRevenueAnalytics();
  const { data: subscriptionCounts, loading: subscriptionsLoading } = useAdminSubscriptionsCount();

  // Compute metrics
  const isLoading = accountsLoading || revenueLoading || subscriptionsLoading;

  const metrics = useMemo(() => {
    const mrr = revenueData?.mrr || 0;
    const previousMrr = mrr * 0.95; // Placeholder for trend calculation
    const growth = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0;

    return {
      accounts: formatCompactNumber(accountCount),
      mrr: formatAdminCurrency(mrr),
      activeSubscriptions: formatCompactNumber(subscriptionCounts.activeCount),
      growth: growth > 0 ? `+${formatPercentage(growth)}` : formatPercentage(growth),
      growthTrend: growth > 0 ? 'up' : growth < 0 ? 'down' : null,
    };
  }, [accountCount, revenueData, subscriptionCounts]);

  // Quick action navigation items
  const quickActions: QuickActionCardProps[] = [
    { 
      icon: Users01, 
      label: 'Manage Accounts', 
      description: 'View and manage user accounts', 
      href: '/admin/accounts' 
    },
    { 
      icon: FileCode01, 
      label: 'Prompts', 
      description: 'Configure AI baseline settings', 
      href: '/admin/prompts' 
    },
    { 
      icon: CreditCard01, 
      label: 'Plans & Billing', 
      description: 'Manage subscription plans', 
      href: '/admin/plans' 
    },
    { 
      icon: Users02, 
      label: 'Pilot Team', 
      description: 'Manage internal team members', 
      href: '/admin/team' 
    },
    { 
      icon: BookOpen01, 
      label: 'Help Articles', 
      description: 'Edit user documentation', 
      href: '/admin/knowledge' 
    },
    { 
      icon: Mail01, 
      label: 'Email Templates', 
      description: 'Manage email content', 
      href: '/admin/emails' 
    },
    { 
      icon: TrendUp01, 
      label: 'Revenue Analytics', 
      description: 'View financial metrics', 
      href: '/admin/analytics' 
    },
    { 
      icon: ClipboardCheck, 
      label: 'Audit Log', 
      description: 'Review admin actions', 
      href: '/admin/audit' 
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users01}
          label="Total Accounts"
          value={isLoading ? '--' : metrics.accounts}
          description="Active accounts"
          loading={isLoading}
        />
        <StatCard
          icon={CreditCard01}
          label="Monthly Revenue"
          value={isLoading ? '--' : metrics.mrr}
          description="MRR"
          loading={isLoading}
        />
        <StatCard
          icon={MessageChatSquare}
          label="Active Subscriptions"
          value={isLoading ? '--' : metrics.activeSubscriptions}
          description="Paying customers"
          loading={isLoading}
        />
        <StatCard
          icon={TrendUp01}
          label="Growth"
          value={isLoading ? '--' : metrics.growth}
          description="vs last month"
          loading={isLoading}
          trend={metrics.growthTrend as 'up' | 'down' | null}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Navigate to admin sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.href}
                icon={action.icon}
                label={action.label}
                description={action.description}
                href={action.href}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
