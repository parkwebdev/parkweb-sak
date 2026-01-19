-- Fix related articles HTML structure
-- Transform empty data-related-articles divs to include anchor elements

-- Create a function to transform related articles JSON to anchor tags
CREATE OR REPLACE FUNCTION pg_temp.transform_related_articles(content text)
RETURNS text AS $$
DECLARE
  result text := content;
  match_record record;
  json_str text;
  json_data jsonb;
  anchors text;
  article record;
BEGIN
  -- Find all data-related-articles blocks
  FOR match_record IN 
    SELECT (regexp_matches(content, '<div data-related-articles data-articles=''([^'']+)''[^>]*></div>', 'g'))[1] as json_content,
           (regexp_matches(content, '(<div data-related-articles data-articles=''[^'']+''[^>]*></div>)', 'g'))[1] as full_match
  LOOP
    json_str := match_record.json_content;
    
    -- Parse JSON and build anchor tags
    BEGIN
      json_data := json_str::jsonb;
      anchors := '';
      
      FOR article IN SELECT * FROM jsonb_array_elements(json_data)
      LOOP
        anchors := anchors || '<a href="/help-center?category=' || 
                   (article.value->>'categoryId') || 
                   '&article=' || 
                   (article.value->>'articleSlug') || 
                   '">' || 
                   (article.value->>'title') || 
                   '</a>';
      END LOOP;
      
      -- Replace the empty div with one containing anchors
      result := replace(result, match_record.full_match, 
                       '<div data-related-articles>' || anchors || '</div>');
    EXCEPTION WHEN OTHERS THEN
      -- Skip if JSON parsing fails
      NULL;
    END;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Apply the transformation to all articles
UPDATE platform_hc_articles
SET content = pg_temp.transform_related_articles(content),
    updated_at = now()
WHERE content LIKE '%data-related-articles%';