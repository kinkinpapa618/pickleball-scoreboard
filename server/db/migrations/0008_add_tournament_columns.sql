-- Add missing columns to tournament_matches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_matches' AND column_name = 'referee_token'
  ) THEN
    ALTER TABLE tournament_matches ADD COLUMN referee_token TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_matches' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE tournament_matches ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
