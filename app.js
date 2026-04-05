const express = require('express');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const db = new Database('orders.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customerName TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    createdAt TEXT NOT NULL
  )
`);

function simulatePaymentGateway() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ approved: true, transactionId: uuidv4() }), 1500);
  });
}

app.post('/orders', async (req, res) => {
  try {
    const { customerName, item, quantity } = req.body;
    if (!customerName || !item || !quantity) {
      return res.status(400).json({ error: 'customerName, item, and quantity are required.' });
    }

    const payment = await simulatePaymentGateway();
    if (!payment.approved) {
      return res.status(402).json({ error: 'Payment failed.' });
    }

    const newOrder = {
      id: uuidv4(),
      customerName,
      item,
      quantity,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO orders (id, customerName, item, quantity, status, createdAt)
      VALUES (@id, @customerName, @item, @quantity, @status, @createdAt)
    `).run(newOrder);

    res.status(201).json({ message: 'Order created successfully.', transactionId: payment.transactionId, order: newOrder });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

app.get('/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders').all();
  res.status(200).json(orders);
});

app.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.status(200).json(order);
});

app.patch('/orders/:id', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.status(200).json({ message: 'Order updated.', order: { ...order, status } });
});

app.delete('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.status(200).json({ message: 'Order deleted successfully.' });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));