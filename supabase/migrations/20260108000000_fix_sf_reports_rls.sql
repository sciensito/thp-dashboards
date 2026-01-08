-- Add RLS policy to allow authenticated users to read sf_reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sf_reports'
    AND policyname = 'Allow authenticated users to read reports'
  ) THEN
    CREATE POLICY "Allow authenticated users to read reports"
    ON sf_reports
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;
