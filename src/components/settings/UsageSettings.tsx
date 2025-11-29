import { PlanLimitsCard } from './PlanLimitsCard';

export const UsageSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Usage</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor your plan usage and limits
        </p>
      </div>

      <PlanLimitsCard />
    </div>
  );
};
