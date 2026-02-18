-- Create manager_connections table for linking referees to managers
CREATE TABLE IF NOT EXISTS manager_connections (
  id SERIAL PRIMARY KEY,
  referee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique connection (one referee can only connect to same manager once)
  UNIQUE(referee_id, manager_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_manager_connections_referee ON manager_connections(referee_id);
CREATE INDEX IF NOT EXISTS idx_manager_connections_manager ON manager_connections(manager_id);

-- Add creator_id to matches table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN creator_id INTEGER REFERENCES users(id);
  END IF;
END $$;
