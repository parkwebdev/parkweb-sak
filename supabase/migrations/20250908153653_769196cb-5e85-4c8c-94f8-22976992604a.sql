-- Normalize industry values in all tables to use consistent format
-- Update client_onboarding_links
UPDATE client_onboarding_links 
SET industry = CASE 
  WHEN industry = 'manufactured-home' THEN 'Manufactured Home Community'
  WHEN industry = 'rv-park' THEN 'RV Park/Resort' 
  WHEN industry = 'local-business' THEN 'Local Business'
  WHEN industry = 'national-business' THEN 'National Business'
  WHEN industry = 'capital-syndication' THEN 'Capital & Syndication'
  ELSE industry 
END;

-- Update onboarding_submissions  
UPDATE onboarding_submissions
SET industry = CASE 
  WHEN industry = 'manufactured-home' THEN 'Manufactured Home Community'
  WHEN industry = 'rv-park' THEN 'RV Park/Resort'
  WHEN industry = 'local-business' THEN 'Local Business' 
  WHEN industry = 'national-business' THEN 'National Business'
  WHEN industry = 'capital-syndication' THEN 'Capital & Syndication'
  ELSE industry 
END;

-- Update scope_of_works
UPDATE scope_of_works
SET industry = CASE 
  WHEN industry = 'manufactured-home' THEN 'Manufactured Home Community'
  WHEN industry = 'rv-park' THEN 'RV Park/Resort'
  WHEN industry = 'local-business' THEN 'Local Business'
  WHEN industry = 'national-business' THEN 'National Business' 
  WHEN industry = 'capital-syndication' THEN 'Capital & Syndication'
  ELSE industry 
END;