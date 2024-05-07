const pg = require('pg');
const express = require('express');
const app = express();

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_ice_cream_db');

app.use(express.json());
app.use(require('morgan')('dev'));

// Create Flavor - C
app.post('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1, $2)
      RETURNING *
    `;
    const { name, is_favorite } = req.body;
    const response = await client.query(SQL, [name, is_favorite]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// Read Flavors - R
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * FROM flavors ORDER BY created_at DESC;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

// Update Flavor - U
app.put('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE flavors
      SET name=$1, is_favorite=$2, updated_at=now()
      WHERE id=$3
      RETURNING *
    `;
    const { name, is_favorite } = req.body;
    const response = await client.query(SQL, [name, is_favorite, req.params.id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// Delete Flavor - D
app.delete('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = `
      DELETE FROM flavors
      WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  try {
    await client.connect();
    let SQL = `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `;
    await client.query(SQL);
    console.log('Tables created');
    SQL = `
      INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', true);
      INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', false);
      INSERT INTO flavors(name, is_favorite) VALUES('Strawberry', false);
    `;
    await client.query(SQL);
    console.log('Data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}`));
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

init();
