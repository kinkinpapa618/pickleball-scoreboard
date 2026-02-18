import { db } from './server/db';

async function migrate() {
  console.log('Creating notifications table...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('chat', 'match', 'tournament', 'schedule', 'system')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE NOT NULL,
      link TEXT,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE`);

  console.log('Notifications table created successfully!');
}

migrate().catch(console.error);
