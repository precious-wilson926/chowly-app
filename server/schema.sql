-- menu_items: the food/drinks you load yourself
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'drink')),
  price NUMERIC(10,2) NOT NULL,
  prep_time_minutes INTEGER NOT NULL
);

-- staff: chefs, bartenders, waiters you load yourself
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('chef', 'bartender', 'waiter'))
);

-- orders: one row per order placed
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_number TEXT,
  status TEXT NOT NULL DEFAULT 'placed'
    CHECK (status IN ('placed', 'assigned', 'served', 'paid')),
  waiting_time_minutes INTEGER NOT NULL,
  waiter_id INTEGER REFERENCES staff(id),
  chef_id INTEGER REFERENCES staff(id),
  bartender_id INTEGER REFERENCES staff(id),
  complaint_text TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- order_items: the many items inside one order
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1
);

INSERT INTO menu_items (name, category, price, prep_time_minutes) VALUES
('Jollof Rice', 'food', 3500, 15),
('Grilled Chicken', 'food', 4500, 20),
('Suya Platter', 'food', 4000, 12),
('Chapman', 'drink', 1500, 5),
('Zobo', 'drink', 1000, 3),
('Chilled Beer', 'drink', 1200, 2);

INSERT INTO staff (name, role) VALUES
('Amaka', 'waiter'),
('Tunde', 'waiter'),
('Chef Ola', 'chef'),
('Chef Bimbo', 'chef'),
('Segun', 'bartender'),
('Ify', 'bartender');