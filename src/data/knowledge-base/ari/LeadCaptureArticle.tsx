/**
 * Lead Capture Article
 */

import { KBCallout, KBRelatedArticles, KBArticleLink } from '@/components/knowledge-base';

export default function LeadCaptureArticle() {
  return (
    <>
      <p>
        Ari can capture visitor information before starting a conversation. 
        Configure a contact form to collect leads and qualify visitors automatically.
      </p>

      <h2 id="how-it-works">How Lead Capture Works</h2>
      <p>
        When enabled, visitors see a contact form before they can chat. This ensures 
        you have their information for follow-up, even if they leave the conversation.
      </p>
      <ol>
        <li>Visitor opens the chat widget</li>
        <li>Contact form appears with your configured fields</li>
        <li>Visitor submits their information</li>
        <li>A lead is created in your{' '}
          <KBArticleLink categoryId="leads" articleSlug="overview">
            Leads
          </KBArticleLink>{' '}
          dashboard
        </li>
        <li>Conversation begins with Ari</li>
      </ol>

      <h2 id="enabling-contact-form">Enabling the Contact Form</h2>
      <p>
        To enable lead capture:
      </p>
      <ol>
        <li>Go to <strong>Ari → Lead Capture</strong></li>
        <li>Toggle <strong>Enable Contact Form</strong> on</li>
        <li>Configure your form title and subtitle</li>
        <li>Add any custom fields you need</li>
      </ol>

      <h2 id="form-configuration">Form Configuration</h2>
      <p>
        Customize your contact form appearance:
      </p>
      <ul>
        <li><strong>Form Title</strong> – The heading visitors see (e.g., "Let's get started")</li>
        <li><strong>Form Subtitle</strong> – Additional context below the title</li>
      </ul>

      <h2 id="default-fields">Default Fields</h2>
      <p>
        The contact form includes three standard fields:
      </p>
      <ul>
        <li><strong>First Name</strong> – Visitor's first name</li>
        <li><strong>Last Name</strong> – Visitor's last name</li>
        <li><strong>Email</strong> – Email address for follow-up</li>
      </ul>
      <p>
        These fields are always included and help identify leads in your dashboard.
      </p>

      <h2 id="custom-fields">Custom Fields</h2>
      <p>
        Add custom fields to collect additional information. Supported field types:
      </p>
      <ul>
        <li><strong>Text</strong> – Single-line text input for names, titles, etc.</li>
        <li><strong>Email</strong> – Email address with validation</li>
        <li><strong>Phone</strong> – Phone number with formatting</li>
        <li><strong>Text Area</strong> – Multi-line text for longer responses</li>
        <li><strong>Select</strong> – Dropdown menu with predefined options</li>
        <li><strong>Checkbox</strong> – Agreement checkboxes (e.g., terms acceptance)</li>
      </ul>

      <h3 id="configuring-custom-fields">Configuring Custom Fields</h3>
      <p>
        For each custom field, you can set:
      </p>
      <ul>
        <li><strong>Label</strong> – The field name shown to visitors</li>
        <li><strong>Placeholder</strong> – Hint text inside the input</li>
        <li><strong>Required</strong> – Whether the field must be filled</li>
        <li><strong>Options</strong> – For select fields, the dropdown choices</li>
      </ul>

      <KBCallout variant="tip">
        Checkbox labels support rich text, making them perfect for terms and conditions 
        agreements with links to your policies.
      </KBCallout>

      <h2 id="lead-creation">Automatic Lead Creation</h2>
      <p>
        When a visitor submits the form:
      </p>
      <ul>
        <li>A new lead is created in your Leads dashboard</li>
        <li>The lead is linked to their conversation</li>
        <li>Custom field data is stored with the lead</li>
        <li>You receive a notification (if enabled)</li>
      </ul>

      <h2 id="duplicate-handling">Duplicate Handling</h2>
      <p>
        If a visitor returns with the same email:
      </p>
      <ul>
        <li>Their existing lead record is updated</li>
        <li>The new conversation is linked to their profile</li>
        <li>Previous conversation history is preserved</li>
      </ul>

      <KBCallout variant="info">
        Duplicate detection uses email addresses. Visitors with different emails 
        will create separate lead records.
      </KBCallout>

      <h2 id="spam-protection">Spam Protection</h2>
      <p>
        The contact form includes built-in protections:
      </p>
      <ul>
        <li><strong>Honeypot fields</strong> – Hidden fields to catch automated bots</li>
        <li><strong>Cloudflare Turnstile</strong> – Invisible CAPTCHA verification</li>
        <li><strong>Submission timing</strong> – Detects suspiciously fast submissions</li>
      </ul>

      <h2 id="privacy">Privacy Considerations</h2>
      <p>
        When collecting visitor information:
      </p>
      <ul>
        <li>Ensure your privacy policy covers data collection</li>
        <li>Consider adding a consent checkbox for marketing</li>
        <li>Lead data is stored securely in your database</li>
        <li>You control data retention and deletion</li>
      </ul>

      <KBCallout variant="warning">
        Comply with GDPR, CCPA, and other privacy regulations when collecting 
        personal information. Add appropriate consent mechanisms for your region.
      </KBCallout>

      <h2 id="notifications">Lead Notifications</h2>
      <p>
        Get notified when new leads are captured. Configure notifications in{' '}
        <KBArticleLink categoryId="settings" articleSlug="notifications">
          Settings → Notifications
        </KBArticleLink>.
      </p>

      <KBRelatedArticles
        articles={[
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
          { categoryId: 'ari', articleSlug: 'welcome-messages', title: 'Welcome & Messages' },
          { categoryId: 'settings', articleSlug: 'notifications', title: 'Notification Preferences' },
        ]}
      />
    </>
  );
}
