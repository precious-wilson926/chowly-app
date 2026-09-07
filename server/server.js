require('dotenv').config();
const path = require('path');
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// ---------- MENU ----------
app.get('/api/menu', async (req, res) => {
  const result = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
  res.json(result.rows);
});

// ---------- STAFF ----------
app.get('/api/staff', async (req, res) => {
  const result = await pool.query('SELECT * FROM staff ORDER BY role, name');
  res.json(result.rows);
});

// ---------- PLACE ORDER ----------
app.post('/api/orders', async (req, res) => {
  const { table_number, items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item' });
  }

  const ids = items.map(i => i.menu_item_id);
  const menuRows = await pool.query(
    'SELECT id, prep_time_minutes FROM menu_items WHERE id = ANY($1)',
    [ids]
  );
  const prepTimeById = Object.fromEntries(menuRows.rows.map(r => [r.id, r.prep_time_minutes]));
  const waitingTime = items.reduce(
    (sum, item) => sum + (prepTimeById[item.menu_item_id] || 0) * item.quantity,
    0
  );

  const orderResult = await pool.query(
    `INSERT INTO orders (table_number, waiting_time_minutes) VALUES ($1, $2) RETURNING *`,
    [table_number, waitingTime]
  );
  const order = orderResult.rows[0];

  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ($1, $2, $3)`,
      [order.id, item.menu_item_id, item.quantity]
    );
  }

  res.status(201).json(order);
});

// ---------- GET ALL ORDERS (waiter list) ----------
app.get('/api/orders', async (req, res) => {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(result.rows);
});

// ---------- GET ONE ORDER (with items) ----------
app.get('/api/orders/:id', async (req, res) => {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (orderResult.rowCount === 0) return res.status(404).json({ error: 'Not found' });

  const itemsResult = await pool.query(
    `SELECT oi.quantity, mi.name, mi.price
     FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [req.params.id]
  );

  res.json({ ...orderResult.rows[0], items: itemsResult.rows });
});

// ---------- ASSIGN CHEF/BARTENDER/WAITER, MARK SERVED ----------
app.patch('/api/orders/:id/assign', async (req, res) => {
  const { waiter_id, chef_id, bartender_id } = req.body;
  const result = await pool.query(
    `UPDATE orders
     SET waiter_id = $1, chef_id = $2, bartender_id = $3, status = 'served'
     WHERE id = $4 RETURNING *`,
    [waiter_id, chef_id, bartender_id, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// ---------- RATING AND/OR COMPLAINT (independent, optional) ----------
app.patch('/api/orders/:id/complaint', async (req, res) => {
  const { complaint_text, rating } = req.body;
  const result = await pool.query(
    `UPDATE orders SET
       complaint_text = COALESCE($1, complaint_text),
       rating = COALESCE($2, rating)
     WHERE id = $3 RETURNING *`,
    [complaint_text ?? null, rating ?? null, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// ---------- PAY (pretend payment) ----------
app.patch('/api/orders/:id/pay', async (req, res) => {
  const result = await pool.query(
    `UPDATE orders SET is_paid = true, paid_at = NOW(), status = 'paid' WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// ---------- SERVE THE BUILT REACT APP (only matters once deployed) ----------
const clientDir = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDir));
app.use((req, res) => res.sendFile(path.join(clientDir, 'index.html')));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('API listening on port ' + port));