/**
 * Locations Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function LocationsArticle() {
  return (
    <>
      <p>
        If your business has multiple locations, configure each one so Ari can 
        provide location-specific information, availability, and directions.
      </p>

      <h2 id="why-locations">Why Use Locations?</h2>
      <p>
        Locations help Ari provide accurate, contextual responses:
      </p>
      <ul>
        <li>Show correct business hours for each location</li>
        <li>Provide accurate address and directions</li>
        <li>Display location-specific contact information</li>
        <li>Schedule appointments at the right place</li>
        <li>Filter knowledge base content by location</li>
      </ul>

      <h2 id="adding-location">Adding a Location</h2>
      <ol>
        <li>Navigate to <strong>Ari</strong> from the sidebar</li>
        <li>Select <strong>Locations</strong></li>
        <li>Click <strong>Add Location</strong></li>
        <li>Fill in the location details</li>
        <li>Save your changes</li>
      </ol>

      <h3 id="location-details">Location Details</h3>
      <p>
        For each location, you can configure:
      </p>
      <ul>
        <li><strong>Name:</strong> Display name (e.g., "Downtown Office")</li>
        <li><strong>Address:</strong> Full street address</li>
        <li><strong>City, State, ZIP:</strong> Location details for search</li>
        <li><strong>Phone:</strong> Location-specific phone number</li>
        <li><strong>Email:</strong> Location-specific email address</li>
        <li><strong>Timezone:</strong> For accurate scheduling</li>
      </ul>

      <KBCallout variant="tip">
        Include the timezone for each location to ensure appointments are 
        scheduled correctly, especially for businesses spanning multiple time zones.
      </KBCallout>

      <h2 id="business-hours">Business Hours</h2>
      <p>
        Set operating hours for each location:
      </p>
      <ul>
        <li>Configure hours for each day of the week</li>
        <li>Set different hours for different days</li>
        <li>Mark days as closed</li>
        <li>Ari uses these hours for scheduling and responses</li>
      </ul>

      <h2 id="url-patterns">URL Patterns</h2>
      <p>
        Link locations to specific pages on your website:
      </p>
      <ul>
        <li>When a visitor chats from a location page, Ari knows the context</li>
        <li>Use URL patterns like <code>/locations/downtown/*</code></li>
        <li>Ari can provide location-specific information automatically</li>
      </ul>

      <h2 id="default-location">Default Location</h2>
      <p>
        Set a default location for when context isn't available:
      </p>
      <ul>
        <li>Used when visitors don't specify a location</li>
        <li>Applies to general inquiries</li>
        <li>Can be your main office or headquarters</li>
      </ul>

      <h2 id="location-knowledge">Location-Specific Knowledge</h2>
      <p>
        Associate knowledge sources with locations:
      </p>
      <ul>
        <li>Each location can have unique FAQ content</li>
        <li>Location-specific documents and information</li>
        <li>Property listings linked to communities</li>
      </ul>

      <KBCallout variant="info">
        When you add a knowledge source, you can optionally assign it to a 
        specific location. This helps Ari give more relevant answers.
      </KBCallout>

      <h2 id="managing-locations">Managing Locations</h2>
      <p>
        Keep your locations up to date:
      </p>
      <ul>
        <li>Edit location details anytime</li>
        <li>Deactivate locations that are temporarily closed</li>
        <li>Delete locations that are permanently closed</li>
        <li>Reorder locations to prioritize important ones</li>
      </ul>

      <h2 id="calendar-integration">Calendar Integration</h2>
      <p>
        Connect calendars to locations for appointment scheduling:
      </p>
      <ul>
        <li>Each location can have its own Google Calendar</li>
        <li>Appointments sync automatically</li>
        <li>Availability is checked per location</li>
      </ul>
    </>
  );
}
