/**
 * Using the Planner Article
 */

import { KBCallout, KBRelatedArticles } from '@/components/knowledge-base';

export default function PlannerOverviewArticle() {
  return (
    <>
      <p>
        The Planner is your calendar hub for managing property showings, move-ins, 
        inspections, and maintenance appointments. When integrated with Ari, 
        visitors can schedule bookings directly during conversations.
      </p>

      <h2 id="event-types">Event Types</h2>
      <p>
        The Planner supports different booking categories, each with its own 
        color for easy identification:
      </p>
      <ul>
        <li><strong>Showings</strong> – Property tours with prospective residents</li>
        <li><strong>Move-ins</strong> – Scheduled move-in appointments</li>
        <li><strong>Inspections</strong> – Property inspection visits</li>
        <li><strong>Maintenance</strong> – Repair and maintenance appointments</li>
      </ul>

      <KBCallout variant="tip">
        Use the tabs at the top of the calendar to filter by event type. 
        The "All Bookings" tab shows everything at once.
      </KBCallout>

      <h2 id="calendar-features">Calendar Features</h2>
      <p>
        The calendar provides a monthly view with:
      </p>
      <ul>
        <li>Color-coded events by type</li>
        <li>Search to find specific bookings</li>
        <li>Navigation between months</li>
        <li>Quick-add buttons on each day</li>
      </ul>

      <h2 id="connecting-calendars">Connecting Your Calendar</h2>
      <p>
        Sync with your existing calendar to:
      </p>
      <ul>
        <li>Show real-time availability to visitors</li>
        <li>Automatically add bookings to your calendar</li>
        <li>Avoid double-booking</li>
      </ul>
      <ol>
        <li>Click <strong>Connect Calendar</strong> at the top of the Planner</li>
        <li>Choose Google Calendar or Outlook</li>
        <li>Follow the authentication prompts</li>
        <li>Select which calendar to sync</li>
      </ol>

      <KBCallout variant="info">
        Currently supported: Google Calendar and Microsoft Outlook.
      </KBCallout>

      <h2 id="creating-events">Creating Events</h2>
      <p>
        Add events manually:
      </p>
      <ol>
        <li>Click on a day in the calendar, or click <strong>Add event</strong></li>
        <li>Select the event type (Showing, Move-in, etc.)</li>
        <li>Choose date, start time, and end time</li>
        <li>Add visitor details if available</li>
        <li>Optionally link to a lead or conversation</li>
        <li>Save the event</li>
      </ol>

      <h2 id="rescheduling">Rescheduling Events</h2>
      <p>
        Move events to a new time:
      </p>
      <ul>
        <li><strong>Drag and drop:</strong> Simply drag an event to a new day</li>
        <li><strong>Edit details:</strong> Click an event and change the date/time</li>
      </ul>

      <KBCallout variant="info">
        When you reschedule an event, you'll be asked for a reason. 
        This helps track why appointments were moved and can be shared 
        with visitors.
      </KBCallout>

      <h2 id="ai-bookings">AI-Booked Appointments</h2>
      <p>
        When Ari books an appointment for a visitor:
      </p>
      <ul>
        <li>The event appears automatically in your Planner</li>
        <li>It's linked to the conversation and lead</li>
        <li>The visitor receives a confirmation</li>
        <li>You get notified based on your preferences</li>
      </ul>

      <h2 id="managing-bookings">Managing Bookings</h2>
      <p>
        Click on any event to:
      </p>
      <ul>
        <li>View visitor details and conversation history</li>
        <li>Edit event information</li>
        <li>Reschedule to a different time</li>
        <li>Mark as complete when finished</li>
        <li>Cancel if needed (with reason tracking)</li>
      </ul>

      <h2 id="conflict-detection">Conflict Detection</h2>
      <p>
        The Planner automatically detects scheduling conflicts:
      </p>
      <ul>
        <li>Warns when creating overlapping events</li>
        <li>Shows conflicts when rescheduling</li>
        <li>Helps prevent double-booking</li>
      </ul>

      <h2 id="color-legend">Color Legend</h2>
      <p>
        A color legend appears at the top of the calendar showing what each 
        color represents. This makes it easy to scan your schedule at a glance.
      </p>

      <h2 id="permissions">Permissions</h2>
      <p>
        Calendar access is controlled by your role:
      </p>
      <ul>
        <li><strong>View Bookings:</strong> See all calendar events</li>
        <li><strong>Manage Bookings:</strong> Create, edit, reschedule, and cancel events</li>
        <li><strong>Manage Integrations:</strong> Connect external calendars</li>
      </ul>

      <KBRelatedArticles
        articles={[
          { categoryId: 'ari', articleSlug: 'integrations', title: 'Integrations' },
          { categoryId: 'inbox', articleSlug: 'overview', title: 'Inbox Overview' },
        ]}
      />
    </>
  );
}
