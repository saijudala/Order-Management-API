const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

// Set up a test app with in-memory database
const app = express();
app.use(express.json());

const db = new Database(':memory:');
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
    setTimeout(() => resolve({ approved: true, transactionId: uuidv4() }), 100);
  });
}

app.post('/orders', async (req, res) => {
  try {
    const { customerName, item, quantity } = req.body;
    if (!customerName || !item || !quantity) {
      return res.status(400).json({ error: 'customerName, item, and quantity are required.' });
    }
    const payment = await simulatePaymentGateway();
    const newOrder = {
      id: uuidv4(),
      customerName,
      item,
      quantity,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    db.prepare(`INSERT INTO orders (id, customerName, item, quantity, status, createdAt)
      VALUES (@id, @customerName, @item, @quantity, @status, @createdAt)`).run(newOrder);
    res.status(201).json({ message: 'Order created successfully.', transactionId: payment.transactionId, order: newOrder });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
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

// --- UNIT TESTS ---
describe('Unit Tests - Input Validation', () => {
  test('POST /orders - missing customerName returns 400', async () => {
    const res = await request(app).post('/orders').send({ item: 'Laptop', quantity: 1 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('customerName, item, and quantity are required.');
  });

  test('POST /orders - missing item returns 400', async () => {
    const res = await request(app).post('/orders').send({ customerName: 'Jane', quantity: 1 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('customerName, item, and quantity are required.');
  });

  test('POST /orders - missing quantity returns 400', async () => {
    const res = await request(app).post('/orders').send({ customerName: 'Jane', item: 'Laptop' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('customerName, item, and quantity are required.');
  });

  test('PATCH /orders/:id - invalid status returns 400', async () => {
    const res = await request(app).patch('/orders/fake-id').send({ status: 'InvalidStatus' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /orders/:id - non-existent ID returns 404', async () => {
    const res = await request(app).get('/orders/non-existent-id');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Order not found.');
  });

  test('DELETE /orders/:id - non-existent ID returns 404', async () => {
    const res = await request(app).delete('/orders/non-existent-id');
    expect(res.statusCode).toBe(404);
  });
});

// --- INTEGRATION TESTS ---
describe('Integration Tests - CRUD Operations', () => {
  let createdOrderId;

  test('POST /orders - creates order successfully', async () => {
    const res = await request(app).post('/orders').send({
      customerName: 'Jane Doe',
      item: 'Laptop',
      quantity: 1
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.order).toHaveProperty('id');
    expect(res.body.order.customerName).toBe('Jane Doe');
    expect(res.body.order.status).toBe('Pending');
    expect(res.body).toHaveProperty('transactionId');
    createdOrderId = res.body.order.id;
  }, 10000);

  test('GET /orders - returns array of orders', async () => {
    const res = await request(app).get('/orders');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /orders/:id - retrieves specific order', async () => {
    const res = await request(app).get(`/orders/${createdOrderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createdOrderId);
    expect(res.body.customerName).toBe('Jane Doe');
  });

  test('PATCH /orders/:id - updates order status', async () => {
    const res = await request(app).patch(`/orders/${createdOrderId}`).send({ status: 'Shipped' });
    expect(res.statusCode).toBe(200);
    expect(res.body.order.status).toBe('Shipped');
  });

  test('DELETE /orders/:id - deletes order', async () => {
    const res = await request(app).delete(`/orders/${createdOrderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Order deleted successfully.');
  });

  test('GET /orders/:id - deleted order returns 404', async () => {
    const res = await request(app).get(`/orders/${createdOrderId}`);
    expect(res.statusCode).toBe(404);
  });
});