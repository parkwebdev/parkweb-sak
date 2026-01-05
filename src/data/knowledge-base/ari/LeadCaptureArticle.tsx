/**
 * Lead Capture Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function LeadCaptureArticle() {
  return (
    <>
      <p>
        Ari can capture visitor information during conversations. Configure what 
        information to collect and when to ask for it.
      </p>

      <h2 id="how-it-works">How Lead Capture Works</h2>
      <p>
        During a conversation, Ari can naturally ask visitors for their contact 
        information. This creates a lead in your system that you can follow up with.
      </p>
      <ol>
        <li>Visitor starts a conversation with Ari</li>
        <li>At the right moment, Ari asks for contact details</li>
        <li>Visitor provides their information</li>
        <li>A lead is automatically created in Leads</li>
        <li>Your team can follow up</li>
      </ol>

      <h2 id="configuring-fields">Configuring Capture Fields</h2>
      <p>
        Choose what information to collect:
      </p>

      <h3 id="required-fields">Available Fields</h3>
      <ul>
        <li><strong>Name</strong> – Visitor's full name</li>
        <li><strong>Email</strong> – Contact email address</li>
        <li><strong>Phone</strong> – Phone number for calls/texts</li>
        <li><strong>Company</strong> – Organization name (for B2B)</li>
        <li><strong>Custom fields</strong> – Any additional information you need</li>
      </ul>

      <h3 id="accessing-settings">Accessing Lead Capture Settings</h3>
      <ol>
        <li>Navigate to <strong>Ari</strong> from the sidebar</li>
        <li>Select <strong>Lead Capture</strong></li>
        <li>Toggle fields on or off</li>
        <li>Mark fields as required or optional</li>
      </ol>

      <KBCallout variant="tip">
        Ask for fewer fields to increase completion rates. Name and email or phone 
        are usually enough to follow up.
      </KBCallout>

      <h2 id="capture-timing">When to Capture Leads</h2>
      <p>
        Configure when Ari should ask for information:
      </p>
      <ul>
        <li><strong>Before booking:</strong> Collect details when scheduling appointments</li>
        <li><strong>On request:</strong> When visitors ask to be contacted</li>
        <li><strong>After key questions:</strong> After showing interest in specific topics</li>
        <li><strong>Before handoff:</strong> When transferring to a human team member</li>
      </ul>

      <h2 id="lead-stages">Automatic Lead Stages</h2>
      <p>
        New leads can be automatically assigned to a stage:
      </p>
      <ul>
        <li>Configure the default stage for new leads</li>
        <li>Set different stages based on how the lead was captured</li>
        <li>Leads from bookings can go to a "Scheduled" stage</li>
      </ul>

      <h2 id="duplicate-handling">Duplicate Handling</h2>
      <p>
        When a returning visitor provides their information:
      </p>
      <ul>
        <li>Ari recognizes existing leads by email or phone</li>
        <li>The conversation is linked to the existing lead</li>
        <li>No duplicate lead is created</li>
      </ul>

      <KBCallout variant="info">
        Duplicate detection is based on email and phone number matching. 
        A visitor can have multiple conversations linked to the same lead.
      </KBCallout>

      <h2 id="privacy">Privacy Considerations</h2>
      <p>
        Respect visitor privacy:
      </p>
      <ul>
        <li>Only collect information you need</li>
        <li>Be transparent about how data will be used</li>
        <li>Allow visitors to decline providing information</li>
        <li>Comply with GDPR, CCPA, and other regulations</li>
      </ul>

      <h2 id="notifications">Lead Notifications</h2>
      <p>
        Get notified when new leads are captured:
      </p>
      <ul>
        <li>Email notifications to your team</li>
        <li>In-app notifications in the sidebar</li>
        <li>Webhook integrations for external systems</li>
      </ul>
    </>
  );
}
