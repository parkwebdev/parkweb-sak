/**
 * Lead Stages Article
 */

import { HCCallout, HCStepByStep, HCRelatedArticles } from '@/components/help-center';

export default function LeadStagesArticle() {
  return (
    <>
      <p>Lead stages help you organize and track leads through your sales process.</p>
      <h2 id="customizing-stages">Customizing Stages</h2>
      <HCStepByStep steps={[
        { title: 'Open the Manage Stages dialog', description: 'Navigate to Leads and click Manage Stages.' },
        { title: 'Add a new stage', description: 'Click Add Stage, enter a name and choose a color.' },
        { title: 'Set a default stage', description: 'Click the star icon to set default for new leads.' },
        { title: 'Reorder stages', description: 'Drag and drop to change order.' },
      ]} />
      <HCCallout variant="tip">Keep your stage count manageable – 5-7 stages is ideal.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' }]} />
    </>
  );
}
