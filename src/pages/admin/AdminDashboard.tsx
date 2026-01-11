/**
 * Admin Dashboard Page
 * 
 * Overview page for the Super Admin Dashboard.
 * Shows key platform metrics and quick actions.
 * 
 * @module pages/admin/AdminDashboard
 */

import { Users01, CreditCard01, MessageChatSquare, TrendUp01 } from '@untitledui/icons';

/**
 * Super Admin Dashboard overview page.
 */
export function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor platform health and key metrics
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users01}
          label="Total Accounts"
          value="--"
          description="Active accounts"
        />
        <StatCard
          icon={CreditCard01}
          label="Monthly Revenue"
          value="--"
          description="MRR"
        />
        <StatCard
          icon={MessageChatSquare}
          label="Conversations"
          value="--"
          description="This month"
        />
        <StatCard
          icon={TrendUp01}
          label="Growth"
          value="--"
          description="vs last month"
        />
      </div>

      {/* Placeholder Content */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Dashboard components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  description: string;
}

function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Icon size={20} className="text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
