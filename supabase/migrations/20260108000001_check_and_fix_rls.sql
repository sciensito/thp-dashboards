-- Make sure RLS is enabled
ALTER TABLE sf_reports ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Allow authenticated users to read reports" ON sf_reports;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read reports"
ON sf_reports
FOR SELECT
TO authenticated
USING (true);

-- Also add policy for anon to read (for testing without auth)
DROP POLICY IF EXISTS "Allow anon to read reports" ON sf_reports;
CREATE POLICY "Allow anon to read reports"
ON sf_reports
FOR SELECT
TO anon
USING (true);
