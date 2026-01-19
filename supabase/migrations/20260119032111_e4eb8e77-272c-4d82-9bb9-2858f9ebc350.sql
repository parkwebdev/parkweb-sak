-- Fix remaining step-by-step articles by converting data-attributes to child elements

-- Fix announcements article (7 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                content,
                '<div data-step data-step-number="1" data-step-title="Navigate to Ari → Announcements" data-step-description="Open the Ari configurator and select the Announcements section."></div>',
                '<div data-step data-step-number="1"><h4>Navigate to Ari → Announcements</h4><p>Open the Ari configurator and select the Announcements section.</p></div>',
                'g'
              ),
              '<div data-step data-step-number="2" data-step-title="Click Add Announcement" data-step-description="Click the Add Announcement button to create a new announcement."></div>',
              '<div data-step data-step-number="2"><h4>Click Add Announcement</h4><p>Click the Add Announcement button to create a new announcement.</p></div>',
              'g'
            ),
            '<div data-step data-step-number="3" data-step-title="Enter Title and Subtitle" data-step-description="Add a compelling headline \(5-7 words max\) and optional subtitle."></div>',
            '<div data-step data-step-number="3"><h4>Enter Title and Subtitle</h4><p>Add a compelling headline (5-7 words max) and optional subtitle.</p></div>',
            'g'
          ),
          '<div data-step data-step-number="4" data-step-title="Add an Image \(Optional\)" data-step-description="Upload a background or featured image that matches your brand."></div>',
          '<div data-step data-step-number="4"><h4>Add an Image (Optional)</h4><p>Upload a background or featured image that matches your brand.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="5" data-step-title="Set Colors" data-step-description="Choose background and text colors for high contrast and readability."></div>',
        '<div data-step data-step-number="5"><h4>Set Colors</h4><p>Choose background and text colors for high contrast and readability.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="6" data-step-title="Add Action URL \(Optional\)" data-step-description="Enter a URL to open when visitors click the announcement."></div>',
      '<div data-step data-step-number="6"><h4>Add Action URL (Optional)</h4><p>Enter a URL to open when visitors click the announcement.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="7" data-step-title="Save and Activate" data-step-description="Save the announcement and toggle it on to make it visible."></div>',
    '<div data-step data-step-number="7"><h4>Save and Activate</h4><p>Save the announcement and toggle it on to make it visible.</p></div>',
    'g'
  )
WHERE slug = 'announcements';

-- Fix custom-tools article (6 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              content,
              '<div data-step data-step-number="1" data-step-title="Navigate to Ari → Custom Tools" data-step-description="Open the Ari configurator and select Custom Tools."></div>',
              '<div data-step data-step-number="1"><h4>Navigate to Ari → Custom Tools</h4><p>Open the Ari configurator and select Custom Tools.</p></div>',
              'g'
            ),
            '<div data-step data-step-number="2" data-step-title="Click Add Tool" data-step-description="Click the Add Tool button."></div>',
            '<div data-step data-step-number="2"><h4>Click Add Tool</h4><p>Click the Add Tool button.</p></div>',
            'g'
          ),
          '<div data-step data-step-number="3" data-step-title="Enter Tool Details" data-step-description="Provide a name and description."></div>',
          '<div data-step data-step-number="3"><h4>Enter Tool Details</h4><p>Provide a name and description.</p></div>',
          'g'
        ),
        '<div data-step data-step-number="4" data-step-title="Set the Endpoint URL" data-step-description="Enter your API endpoint URL."></div>',
        '<div data-step data-step-number="4"><h4>Set the Endpoint URL</h4><p>Enter your API endpoint URL.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="5" data-step-title="Define Parameters" data-step-description="Add input parameters Ari should collect."></div>',
      '<div data-step data-step-number="5"><h4>Define Parameters</h4><p>Add input parameters Ari should collect.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="6" data-step-title="Test and Enable" data-step-description="Test, then enable the tool."></div>',
    '<div data-step data-step-number="6"><h4>Test and Enable</h4><p>Test, then enable the tool.</p></div>',
    'g'
  )
WHERE slug = 'custom-tools';

-- Fix installation article (3 steps)
UPDATE platform_hc_articles SET content = 
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        content,
        '<div data-step data-step-number="1" data-step-title="Navigate to Ari → Installation" data-step-description="Open the Ari configurator, then click Installation."></div>',
        '<div data-step data-step-number="1"><h4>Navigate to Ari → Installation</h4><p>Open the Ari configurator, then click Installation.</p></div>',
        'g'
      ),
      '<div data-step data-step-number="2" data-step-title="Copy the Embed Code" data-step-description="Click the copy button to copy the embed code snippet."></div>',
      '<div data-step data-step-number="2"><h4>Copy the Embed Code</h4><p>Click the copy button to copy the embed code snippet.</p></div>',
      'g'
    ),
    '<div data-step data-step-number="3" data-step-title="Paste into Your Website" data-step-description="Add the code before the closing </body> tag."></div>',
    '<div data-step data-step-number="3"><h4>Paste into Your Website</h4><p>Add the code before the closing &lt;/body&gt; tag.</p></div>',
    'g'
  )
WHERE slug = 'installation';