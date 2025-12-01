import { PlanLimitsCard } from './PlanLimitsCard';
import { AnimatedItem } from '@/components/ui/animated-item';

export const UsageSettings = () => {
  return (
    <div className="space-y-6">
      <AnimatedItem>
        <PlanLimitsCard />
      </AnimatedItem>
    </div>
  );
};
