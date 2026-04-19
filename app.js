const express = require('express');
const orderController = require('./controllers/orderController');

const app = express();
app.use(express.json());

app.post('/orders', orderController.createOrder);
app.get('/orders', orderController.getAllOrders);
app.get('/orders/:id', orderController.getOrderById);
app.patch('/orders/:id', orderController.updateOrderStatus);
app.delete('/orders/:id', orderController.deleteOrder);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;