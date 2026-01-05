/**
 * Planner Overview Article
 */

import { KBCallout, KBRelatedArticles, KBArticleLink } from '@/components/knowledge-base';

export default function PlannerOverviewArticle() {
  return (
    <>
      <p>
        The Planner helps you manage appointments, showings, and events. View 
        your schedule, track AI-booked appointments, and stay organized with 
        calendar integrations.
      </p>

      <h2 id="event-types">Event Types</h2>
      <p>
        Events are color-coded by type:
      </p>
      <ul>
        <li><strong>Appointments</strong> – Scheduled meetings with leads or clients</li>
        <li><strong>Showings</strong> – Property tours and viewings</li>
        <li><strong>Consultations</strong> – Advisory sessions</li>
        <li><strong>Follow-ups</strong> – Reminder events for outreach</li>
        <li><strong>External</strong> – Events synced from external calendars</li>
      </ul>

      <KBCallout variant="tip">
        Use the event type filter tabs to focus on specific types of events.
      </KBCallout>

      <h2 id="calendar-views">Calendar Views</h2>
      <p>
        Switch between views to see your schedule differently:
      </p>
      <ul>
        <li><strong>Month View</strong> – See the whole month at a glance with events 
        shown as blocks on each day</li>
        <li><strong>Week View</strong> – Detailed view of a single week with time slots</li>
        <li><strong>Day View</strong> – Focus on a single day with full event details</li>
      </ul>
      <p>
        Use the view toggle in the calendar header to switch between views.
      </p>

      <h2 id="calendar-integration">Calendar Integration</h2>
      <p>
        Connect external calendars to sync events:
      </p>
      <ul>
        <li><strong>Google Calendar</strong> – Full two-way sync</li>
        <li><strong>Microsoft Outlook</strong> – Full two-way sync</li>
      </ul>
      <p>
        Connected calendars appear with a badge, and external events are marked 
        with a different color. Click <strong>Connect Calendar</strong> to set up 
        an integration.
      </p>

      <KBCallout variant="info">
        Events from connected calendars sync automatically. Changes made in either 
        Pilot or your external calendar will appear in both places.
      </KBCallout>

      <h2 id="creating-events">Creating Events</h2>
      <p>
        Add new events to your calendar:
      </p>
      <ol>
        <li>Click the <strong>Add Event</strong> button, or click directly on a date</li>
        <li>Fill in the event details:
          <ul>
            <li>Title and description</li>
            <li>Event type</li>
            <li>Date and time</li>
            <li>Location (optional)</li>
            <li>Associated lead (optional)</li>
          </ul>
        </li>
        <li>Click <strong>Create</strong> to save</li>
      </ol>

      <h2 id="editing-events">Editing Events</h2>
      <p>
        Modify existing events:
      </p>
      <ul>
        <li><strong>Click an event</strong> – Opens the event detail panel</li>
        <li><strong>Edit fields</strong> – Update title, time, description, etc.</li>
        <li><strong>Save changes</strong> – Click Save to confirm</li>
      </ul>

      <h3 id="drag-and-drop">Drag and Drop</h3>
      <p>
        Quickly reschedule events by dragging them to a new date or time:
      </p>
      <ul>
        <li>Click and hold an event</li>
        <li>Drag it to the new date/time</li>
        <li>Release to drop</li>
        <li>Optionally add a reason for the time change</li>
      </ul>

      <h3 id="event-resizing">Event Resizing</h3>
      <p>
        Adjust event duration by resizing:
      </p>
      <ul>
        <li>Hover over the edge of an event in week or day view</li>
        <li>Drag the edge to extend or shorten the event</li>
        <li>Release to confirm the new duration</li>
      </ul>

      <h2 id="time-change-tracking">Time Change Tracking</h2>
      <p>
        When you reschedule an event, you can record why:
      </p>
      <ul>
        <li>A dialog appears after moving an event</li>
        <li>Select a reason (e.g., "Client requested", "Conflict", etc.)</li>
        <li>Add optional notes</li>
        <li>The change is logged in the event's history</li>
      </ul>
      <p>
        This helps track patterns and improve scheduling over time.
      </p>

      <h2 id="ai-appointments">AI-Booked Appointments</h2>
      <p>
        Ari can book appointments during conversations. When this happens:
      </p>
      <ul>
        <li>The event appears on your calendar automatically</li>
        <li>The event is linked to the lead and conversation</li>
        <li>An "AI Booked" badge indicates it was scheduled by Ari</li>
        <li>You receive a notification (if enabled)</li>
      </ul>
      <p>
        Configure Ari's booking behavior in the{' '}
        <KBArticleLink categoryId="ari" articleSlug="custom-tools">
          Custom Tools
        </KBArticleLink>{' '}
        section.
      </p>

      <h2 id="conflict-detection">Conflict Detection</h2>
      <p>
        The calendar warns you about scheduling conflicts:
      </p>
      <ul>
        <li>Events at the same time are highlighted</li>
        <li>When creating events, conflicts are shown before saving</li>
        <li>External calendar events are included in conflict checking</li>
      </ul>

      <KBCallout variant="warning">
        Double-check for conflicts when scheduling important appointments. 
        External calendar sync may have a slight delay.
      </KBCallout>

      <h2 id="deleting-events">Deleting Events</h2>
      <p>
        Remove events from your calendar:
      </p>
      <ol>
        <li>Click the event to open its details</li>
        <li>Click the <strong>Delete</strong> button</li>
        <li>Confirm the deletion</li>
      </ol>
      <p>
        Deleted events are removed from connected external calendars as well.
      </p>

      <h2 id="completing-events">Marking Events Complete</h2>
      <p>
        Track which appointments have been completed:
      </p>
      <ul>
        <li>Open the event detail panel</li>
        <li>Click <strong>Mark Complete</strong></li>
        <li>Completed events show with a checkmark</li>
      </ul>

      <h2 id="color-legend">Color Legend</h2>
      <p>
        A color legend appears below the calendar showing what each color means. 
        This helps you quickly identify event types at a glance.
      </p>

      <h2 id="permissions">Permissions</h2>
      <p>
        Event management permissions depend on your team role:
      </p>
      <ul>
        <li><strong>View only</strong> – Can see events but not create or edit</li>
        <li><strong>Manage bookings</strong> – Can create, edit, and delete events</li>
      </ul>
      <p>
        Check with your team admin if you need additional permissions.
      </p>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'custom-tools', title: 'Custom Tools' },
          { categoryId: 'leads', articleSlug: 'overview', title: 'Lead Management' },
          { categoryId: 'settings', articleSlug: 'notifications', title: 'Notification Preferences' },
        ]}
      />
    </>
  );
}
