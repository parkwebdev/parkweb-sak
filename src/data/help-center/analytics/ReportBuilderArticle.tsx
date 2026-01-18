/**
 * Report Builder Article
 */

import { HCCallout, HCStepByStep, HCRelatedArticles } from '@/components/help-center';

export default function ReportBuilderArticle() {
  return (
    <>
      <p>The Report Builder helps you create comprehensive reports to share with your team.</p>
      <h2 id="accessing-report-builder">Accessing Report Builder</h2>
      <HCStepByStep steps={[
        { title: 'Open Analytics', description: 'Navigate to Analytics from the sidebar.' },
        { title: 'Go to Reports Tab', description: 'Click the Reports tab.' },
        { title: 'Click Build Report', description: 'Click Build Report to open configuration.' },
      ]} />
      <HCCallout variant="tip">Start with a focused report featuring 2-3 sections.</HCCallout>
      <HCRelatedArticles articles={[{ categoryId: 'analytics', articleSlug: 'overview', title: 'Analytics Overview' }]} />
    </>
  );
}
