const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

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

const createOrder = async ({ customerName, item, quantity }) => {
  const payment = await simulatePaymentGateway();
  if (!payment.approved) throw new Error('Payment failed.');
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
  return { message: 'Order created successfully.', transactionId: payment.transactionId, order: newOrder };
};

const getAllOrders = async () => {
  return db.prepare('SELECT * FROM orders').all();
};

const getOrderById = async (id) => {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) || null;
};

const updateOrderStatus = async (id, status) => {
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
};

const deleteOrder = async (id) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, deleteOrder };