-- Allow public/anonymous users to create leads via widget
CREATE POLICY "Public can create leads via widget"
ON leads
FOR INSERT
WITH CHECK (true);