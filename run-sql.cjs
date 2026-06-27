const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  connectionString: 'postgresql://pickleball_user:AbeiYFtZPkccYwSyxmY7SLLTDe9Hvxbc@dpg-d8vi2qtaeets73d2mcmg-a.oregon-postgres.render.com:5432/pickleball_yixz',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => {
    const sql = fs.readFileSync('drizzle/0000_happy_apocalypse.sql', 'utf8');
    return client.query(sql);
  })
  .then(() => console.log('Success'))
  .catch(e => console.error(e))
  .finally(() => client.end());
