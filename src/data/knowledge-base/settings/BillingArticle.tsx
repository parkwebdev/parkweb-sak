/**
 * Billing & Subscription Article
 */

import { KBCallout } from '@/components/knowledge-base/KBCallout';

export default function BillingArticle() {
  return (
    <>
      <p>
        Manage your Pilot subscription, update payment methods, and view 
        invoices all in one place.
      </p>

      <h2 id="current-plan">Viewing Your Current Plan</h2>
      <p>
        Go to Settings → Billing to see:
      </p>
      <ul>
        <li>Your current plan and pricing</li>
        <li>Billing cycle (monthly or annual)</li>
        <li>Next billing date</li>
        <li>Usage for the current period</li>
      </ul>

      <h2 id="upgrading">Upgrading Your Plan</h2>
      <p>
        Need more features or higher limits? Upgrade your plan:
      </p>
      <ol>
        <li>Go to Settings → Billing</li>
        <li>Click <strong>Upgrade Plan</strong></li>
        <li>Select your new plan</li>
        <li>Confirm the upgrade</li>
      </ol>

      <KBCallout variant="info">
        When you upgrade, you're immediately charged a prorated amount for 
        the remainder of your billing cycle.
      </KBCallout>

      <h2 id="payment-methods">Managing Payment Methods</h2>
      <p>
        Keep your payment information up to date:
      </p>
      <ul>
        <li>Add a new credit card</li>
        <li>Update expiration dates</li>
        <li>Set a default payment method</li>
        <li>Remove old cards</li>
      </ul>

      <h2 id="invoices">Viewing Invoices</h2>
      <p>
        Access all your billing history:
      </p>
      <ul>
        <li>View past invoices</li>
        <li>Download PDF receipts</li>
        <li>See payment status</li>
      </ul>

      <h2 id="usage">Understanding Usage</h2>
      <p>
        Track your usage against plan limits:
      </p>
      <ul>
        <li><strong>Conversations</strong> – Monthly chat sessions</li>
        <li><strong>Messages</strong> – AI-generated responses</li>
        <li><strong>Team Members</strong> – Users on your account</li>
        <li><strong>Knowledge Sources</strong> – Documents and URLs indexed</li>
      </ul>

      <KBCallout variant="warning" title="Approaching Limits">
        You'll receive notifications when approaching your plan limits. 
        Consider upgrading to avoid service interruption.
      </KBCallout>

      <h2 id="cancellation">Canceling Your Subscription</h2>
      <p>
        If you need to cancel:
      </p>
      <ol>
        <li>Go to Settings → Billing</li>
        <li>Click <strong>Cancel Subscription</strong></li>
        <li>Complete the cancellation process</li>
      </ol>

      <KBCallout variant="note">
        Your account remains active until the end of your current billing 
        period. You can reactivate anytime before then.
      </KBCallout>
    </>
  );
}
