import { PlanLimitsCard } from './PlanLimitsCard';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

export const UsageSettings = () => {
  return (
    <AnimatedList className="space-y-6">
      <AnimatedItem>
        <PlanLimitsCard />
      </AnimatedItem>
    </AnimatedList>
  );
};
