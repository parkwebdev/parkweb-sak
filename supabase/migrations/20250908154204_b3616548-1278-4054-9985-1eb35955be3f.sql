-- Remove all onboarding_submissions except those related to Aaron Chachamovits/ParkWeb
DELETE FROM onboarding_submissions 
WHERE client_email != 'aaron@park-web.com' 
OR client_name NOT LIKE '%Aaron%';

-- Keep only the Aaron Chachamovits client_onboarding_links entry
DELETE FROM client_onboarding_links 
WHERE email != 'aaron@park-web.com' 
OR client_name != 'Aaron Chachamovits';