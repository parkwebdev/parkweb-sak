-- Fix remaining step-by-step items using a more flexible pattern

-- Installation step 3
UPDATE platform_hc_articles SET content = 
  REPLACE(
    content,
    '<div data-step data-step-number="3" data-step-title="Paste into Your Website" data-step-description="Add the code before the closing &lt;/body&gt; tag."></div>',
    '<div data-step data-step-number="3"><h4>Paste into Your Website</h4><p>Add the code before the closing &lt;/body&gt; tag.</p></div>'
  )
WHERE slug = 'installation';

-- News article steps (multiple step-by-step blocks)
UPDATE platform_hc_articles SET content = 
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                content,
                '<div data-step data-step-number="1" data-step-title="Go to Ari Settings" data-step-description="Navigate to Ari → Welcome & Messages."></div>',
                '<div data-step data-step-number="1"><h4>Go to Ari Settings</h4><p>Navigate to Ari → Welcome & Messages.</p></div>'
              ),
              '<div data-step data-step-number="2" data-step-title="Enable News Tab" data-step-description="Toggle on the News tab option in Bottom Navigation."></div>',
              '<div data-step data-step-number="2"><h4>Enable News Tab</h4><p>Toggle on the News tab option in Bottom Navigation.</p></div>'
            ),
            '<div data-step data-step-number="3" data-step-title="Save Changes" data-step-description="Your widget will now show a News tab."></div>',
            '<div data-step data-step-number="3"><h4>Save Changes</h4><p>Your widget will now show a News tab.</p></div>'
          ),
          '<div data-step data-step-number="1" data-step-title="Navigate to Ari → News" data-step-description="Open the News section in your Ari configuration."></div>',
          '<div data-step data-step-number="1"><h4>Navigate to Ari → News</h4><p>Open the News section in your Ari configuration.</p></div>'
        ),
        '<div data-step data-step-number="2" data-step-title="Click Add News Item" data-step-description="Start creating a new news entry."></div>',
        '<div data-step data-step-number="2"><h4>Click Add News Item</h4><p>Start creating a new news entry.</p></div>'
      ),
      '<div data-step data-step-number="3" data-step-title="Add Content" data-step-description="Enter a title, optional featured image, and your content."></div>',
      '<div data-step data-step-number="3"><h4>Add Content</h4><p>Enter a title, optional featured image, and your content.</p></div>'
    ),
    '<div data-step data-step-number="4" data-step-title="Publish" data-step-description="Toggle the item to published when ready."></div>',
    '<div data-step data-step-number="4"><h4>Publish</h4><p>Toggle the item to published when ready.</p></div>'
  )
WHERE slug = 'news';

-- Report-builder steps 2 and 3
UPDATE platform_hc_articles SET content = 
  REPLACE(
    REPLACE(
      content,
      '<div data-step data-step-number="2" data-step-title="Go to Reports Tab" data-step-description="Click the Reports tab at the top of the page."></div>',
      '<div data-step data-step-number="2"><h4>Go to Reports Tab</h4><p>Click the Reports tab at the top of the page.</p></div>'
    ),
    '<div data-step data-step-number="3" data-step-title="Click Build Report" data-step-description="Click the Build Report button to open the configuration panel."></div>',
    '<div data-step data-step-number="3"><h4>Click Build Report</h4><p>Click the Build Report button to open the configuration panel.</p></div>'
  )
WHERE slug = 'report-builder';