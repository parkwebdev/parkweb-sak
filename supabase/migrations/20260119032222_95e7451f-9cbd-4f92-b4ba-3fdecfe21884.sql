-- Fix billing article (4 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          content,
          '<div data-step data-step-number="1" data-step-title="Go to Billing" data-step-description="Navigate to Settings → Billing."></div>',
          '<div data-step data-step-number="1"><h4>Go to Billing</h4><p>Navigate to Settings → Billing.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="2" data-step-title="Click Upgrade" data-step-description="Click the Upgrade button next to your current plan."></div>',
        '<div data-step data-step-number="2"><h4>Click Upgrade</h4><p>Click the Upgrade button next to your current plan.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="3" data-step-title="Choose New Plan" data-step-description="Select the plan that best fits your needs."></div>',
      '<div data-step data-step-number="3"><h4>Choose New Plan</h4><p>Select the plan that best fits your needs.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="4" data-step-title="Confirm Payment" data-step-description="Review the prorated amount and confirm."></div>',
    '<div data-step data-step-number="4"><h4>Confirm Payment</h4><p>Review the prorated amount and confirm.</p></div>',
    'g'
  )
WHERE slug = 'billing';

-- Fix takeover article (4 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          content,
          '<div data-step data-step-number="1" data-step-title="Open the Conversation" data-step-description="Find and select the conversation in your Inbox."></div>',
          '<div data-step data-step-number="1"><h4>Open the Conversation</h4><p>Find and select the conversation in your Inbox.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="2" data-step-title="Click Take Over" data-step-description="Click the Take Over button in the conversation header."></div>',
        '<div data-step data-step-number="2"><h4>Click Take Over</h4><p>Click the Take Over button in the conversation header.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="3" data-step-title="Visitor Notification" data-step-description="The visitor will see a message that a human has joined the chat."></div>',
      '<div data-step data-step-number="3"><h4>Visitor Notification</h4><p>The visitor will see a message that a human has joined the chat.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="4" data-step-title="Start Responding" data-step-description="Type your message and send. You''re now in control."></div>',
    '<div data-step data-step-number="4"><h4>Start Responding</h4><p>Type your message and send. You''re now in control.</p></div>',
    'g'
  )
WHERE slug = 'takeover';

-- Fix team article (5 steps) - need to check content first
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            content,
            '<div data-step data-step-number="1" data-step-title="Go to Team Settings" data-step-description="Navigate to Settings → Team."></div>',
            '<div data-step data-step-number="1"><h4>Go to Team Settings</h4><p>Navigate to Settings → Team.</p></div>',
            'g'
          ),
          '<div data-step data-step-number="2" data-step-title="Click Invite Member" data-step-description="Click the Invite Member button."></div>',
          '<div data-step data-step-number="2"><h4>Click Invite Member</h4><p>Click the Invite Member button.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="3" data-step-title="Enter Email Address" data-step-description="Enter the email of the person you want to invite."></div>',
        '<div data-step data-step-number="3"><h4>Enter Email Address</h4><p>Enter the email of the person you want to invite.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="4" data-step-title="Select Role" data-step-description="Choose the appropriate role and permissions."></div>',
      '<div data-step data-step-number="4"><h4>Select Role</h4><p>Choose the appropriate role and permissions.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="5" data-step-title="Send Invitation" data-step-description="Click Send to email the invitation."></div>',
    '<div data-step data-step-number="5"><h4>Send Invitation</h4><p>Click Send to email the invitation.</p></div>',
    'g'
  )
WHERE slug = 'team';