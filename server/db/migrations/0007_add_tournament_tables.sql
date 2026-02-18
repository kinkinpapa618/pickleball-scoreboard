-- Create tournament_players table
CREATE TABLE IF NOT EXISTS tournament_players (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_name TEXT,
  seed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);

-- Create tournament_matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  team1_player1 TEXT NOT NULL,
  team1_player2 TEXT NOT NULL,
  team2_player1 TEXT NOT NULL,
  team2_player2 TEXT NOT NULL,
  group_name TEXT,
  round INTEGER,
  match_order INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  referee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  referee_token TEXT,
  court_id INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_referee ON tournament_matches(referee_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_court ON tournament_matches(court_id);
