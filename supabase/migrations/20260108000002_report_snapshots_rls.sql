-- Enable RLS on report_snapshots
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read snapshots
DROP POLICY IF EXISTS "Allow authenticated users to read snapshots" ON report_snapshots;
CREATE POLICY "Allow authenticated users to read snapshots"
ON report_snapshots
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to read snapshots (for testing)
DROP POLICY IF EXISTS "Allow anon to read snapshots" ON report_snapshots;
CREATE POLICY "Allow anon to read snapshots"
ON report_snapshots
FOR SELECT
TO anon
USING (true);
