/**
 * Admin Emails Page
 * 
 * Manage email templates and feature announcements.
 * Preview and test email delivery.
 * 
 * @module pages/admin/AdminEmails
 */

import { useMemo } from 'react';
import { Mail01 } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EmailTemplateList, 
  AnnouncementBuilder, 
  EmailDeliveryLogs, 
  EmailDeliveryStats 
} from '@/components/admin/emails';
import { AdminPermissionGuard } from '@/components/admin/AdminPermissionGuard';
import { useEmailDeliveryLogs } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';

/**
 * Email templates and announcements page for Super Admin.
 */
export function AdminEmails() {
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={Mail01} title="Emails" />,
  }), []);
  useTopBar(topBarConfig);

  const { logs, stats, loading } = useEmailDeliveryLogs();

  return (
    <AdminPermissionGuard permission="view_content">
      <div className="p-6 space-y-6">
        {/* Delivery Stats - no header, TopBar handles page title */}
        <EmailDeliveryStats stats={stats} loading={loading} />

        {/* Tabs */}
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <EmailTemplateList 
              templates={[]} 
              loading={loading} 
              onPreview={() => {}} 
              onEdit={() => {}} 
            />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementBuilder onSend={async () => {}} />
          </TabsContent>

          <TabsContent value="logs">
            <EmailDeliveryLogs logs={logs || []} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPermissionGuard>
  );
}
