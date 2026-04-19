const orderService = require('../services/orderService');

const createOrder = async (req, res) => {
  try {
    const { customerName, item, quantity } = req.body;
    if (!customerName || !item || quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'customerName, item, and quantity are required.' });
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive number.' });
    }
    const result = await orderService.createOrder({ customerName, item, quantity });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const updated = await orderService.updateOrderStatus(req.params.id, status);
    return res.status(200).json({ message: 'Order updated.', order: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    await orderService.deleteOrder(req.params.id);
    return res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, deleteOrder };