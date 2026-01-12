/**
 * Admin Emails Page
 * 
 * Manage email templates and feature announcements.
 * Preview and test email delivery.
 * 
 * @module pages/admin/AdminEmails
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EmailTemplateList, 
  AnnouncementBuilder, 
  EmailDeliveryLogs, 
  EmailDeliveryStats 
} from '@/components/admin/emails';
import { useEmailDeliveryLogs } from '@/hooks/admin';

/**
 * Email templates and announcements page for Super Admin.
 */
export function AdminEmails() {
  const { logs, stats, loading } = useEmailDeliveryLogs();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Emails</h1>
        <p className="text-sm text-muted-foreground">
          Manage email templates and feature announcements
        </p>
      </div>

      {/* Delivery Stats */}
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
  );
}
