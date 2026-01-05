/**
 * Using the Calendar Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function PlannerOverviewArticle() {
  return (
    <>
      <p>
        The Planner is your calendar hub for managing bookings and appointments. 
        When integrated with Ari, visitors can schedule meetings directly during 
        conversations.
      </p>

      <h2 id="calendar-views">Calendar Views</h2>
      <p>
        View your schedule in different formats:
      </p>
      <ul>
        <li><strong>Month View</strong> – Overview of the entire month</li>
        <li><strong>Week View</strong> – Detailed weekly schedule</li>
        <li><strong>Day View</strong> – Hour-by-hour breakdown</li>
        <li><strong>Agenda View</strong> – List of upcoming events</li>
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

      <KBCallout variant="info">
        Currently supported: Google Calendar. More integrations coming soon!
      </KBCallout>

      <h2 id="creating-events">Creating Events</h2>
      <p>
        Add events manually:
      </p>
      <ol>
        <li>Click on a time slot or the "New Event" button</li>
        <li>Fill in the event details</li>
        <li>Optionally link to a lead or conversation</li>
        <li>Save the event</li>
      </ol>

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
        For each booking you can:
      </p>
      <ul>
        <li>View visitor details and conversation history</li>
        <li>Reschedule to a different time</li>
        <li>Cancel if needed (visitor is notified)</li>
        <li>Add notes for your team</li>
      </ul>

      <KBCallout variant="tip">
        Set up booking confirmations and reminders in Ari → Welcome & Messages 
        to reduce no-shows.
      </KBCallout>

      <h2 id="availability">Setting Availability</h2>
      <p>
        Control when visitors can book:
      </p>
      <ul>
        <li>Set business hours for each day</li>
        <li>Block out specific times</li>
        <li>Set buffer time between appointments</li>
        <li>Configure how far in advance bookings can be made</li>
      </ul>
    </>
  );
}
