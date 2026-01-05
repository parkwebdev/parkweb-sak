/**
 * Welcome & Messages Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function WelcomeMessagesArticle() {
  return (
    <>
      <p>
        First impressions matter. Configure Ari's welcome message and quick action 
        buttons to greet visitors and guide them to common tasks.
      </p>

      <h2 id="welcome-message">Welcome Message</h2>
      <p>
        The welcome message appears when a visitor opens the chat widget. 
        This is your chance to:
      </p>
      <ul>
        <li>Greet visitors warmly</li>
        <li>Introduce what Ari can help with</li>
        <li>Set expectations for the conversation</li>
      </ul>

      <h3 id="editing-welcome">Editing the Welcome Message</h3>
      <ol>
        <li>Navigate to <strong>Ari</strong> from the sidebar</li>
        <li>Select <strong>Welcome & Messages</strong></li>
        <li>Edit the text in the Welcome Message field</li>
        <li>Your changes save automatically</li>
      </ol>

      <KBCallout variant="tip">
        Keep your welcome message short and action-oriented. 
        Example: "Hi! I'm Ari. I can help you schedule a tour, answer questions, 
        or find the perfect home. What would you like to do?"
      </KBCallout>

      <h2 id="quick-actions">Quick Action Buttons</h2>
      <p>
        Quick actions are clickable buttons that appear below the welcome message. 
        They help visitors start common tasks with a single tap.
      </p>

      <h3 id="default-actions">Common Quick Actions</h3>
      <ul>
        <li><strong>Schedule a Tour</strong> – Opens the booking flow</li>
        <li><strong>View Available Homes</strong> – Shows property listings</li>
        <li><strong>Contact Us</strong> – Initiates a conversation about contacting the team</li>
        <li><strong>Get Directions</strong> – Provides location information</li>
      </ul>

      <h3 id="managing-actions">Managing Quick Actions</h3>
      <ol>
        <li>Go to <strong>Ari → Welcome & Messages</strong></li>
        <li>Find the Quick Actions section</li>
        <li>Add, edit, or reorder actions as needed</li>
        <li>Toggle actions on or off</li>
      </ol>

      <h2 id="booking-confirmation">Booking Confirmation Message</h2>
      <p>
        When a visitor books an appointment, they receive a confirmation message. 
        Customize this to:
      </p>
      <ul>
        <li>Confirm the booking details</li>
        <li>Explain what happens next</li>
        <li>Provide contact information for changes</li>
      </ul>

      <h2 id="reminder-messages">Reminder Messages</h2>
      <p>
        Set up automated reminders to reduce no-shows:
      </p>
      <ul>
        <li><strong>24-hour reminder</strong> – Sent the day before</li>
        <li><strong>1-hour reminder</strong> – Sent shortly before the appointment</li>
      </ul>

      <KBCallout variant="info">
        Reminder messages are sent via the same channel the visitor used to book 
        (usually the chat widget or email if provided).
      </KBCallout>

      <h2 id="fallback-messages">Fallback Messages</h2>
      <p>
        Configure what Ari says when it can't help:
      </p>
      <ul>
        <li><strong>Unknown question:</strong> "I'm not sure about that. Would you like me to connect you with someone who can help?"</li>
        <li><strong>Technical error:</strong> "Sorry, I'm having trouble right now. Please try again in a moment."</li>
        <li><strong>Outside business hours:</strong> Custom message for after-hours inquiries</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Keep messages concise and scannable</li>
        <li>Use friendly, conversational language</li>
        <li>Limit quick actions to 3-4 most common tasks</li>
        <li>Test messages on mobile devices (shorter is better)</li>
        <li>Include a human handoff option for complex issues</li>
      </ul>
    </>
  );
}
