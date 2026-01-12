// Plans Components Stubs
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export function PlansTable() { return <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">Plans table coming soon</div>; }
export function PlanEditorSheet() { return null; }
export function PlanLimitsEditor() { return <div>Limits editor</div>; }
export function PlanFeaturesEditor() { return <div>Features editor</div>; }
export function SubscriptionsTable() { return <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">Subscriptions table coming soon</div>; }
export function RevenueMetricsCards({ mrr = 0, arr = 0, churnRate = 0 }: { mrr?: number; arr?: number; churnRate?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">MRR</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${mrr.toLocaleString()}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ARR</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${arr.toLocaleString()}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Churn Rate</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{churnRate}%</p></CardContent></Card>
    </div>
  );
}
