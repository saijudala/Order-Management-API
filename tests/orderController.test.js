const orderController = require('../controllers/orderController');
const orderService = require('../services/orderService');

jest.mock('../services/orderService');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

afterEach(() => {
  jest.clearAllMocks();
});

// createOrder

describe('createOrder', () => {


  it('should create an order and return 201 with valid input', async () => {
    const mockOrder = {
      message: 'Order created successfully.',
      transactionId: 'txn-123',
      order: { id: 'abc-1', customerName: 'Jane Doe', item: 'Laptop', quantity: 1, status: 'Pending', createdAt: '2026-01-01T00:00:00Z' }
    };
    orderService.createOrder.mockResolvedValue(mockOrder);

    const req = { body: { customerName: 'Jane Doe', item: 'Laptop', quantity: 1 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(orderService.createOrder).toHaveBeenCalledWith({ customerName: 'Jane Doe', item: 'Laptop', quantity: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Order created successfully.' }));
  });

  it('should create an order with quantity of 1 (boundary condition)', async () => {
    const mockOrder = {
      message: 'Order created successfully.',
      transactionId: 'txn-456',
      order: { id: 'abc-2', customerName: 'John', item: 'Mouse', quantity: 1, status: 'Pending', createdAt: '2026-01-01T00:00:00Z' }
    };
    orderService.createOrder.mockResolvedValue(mockOrder);

    const req = { body: { customerName: 'John', item: 'Mouse', quantity: 1 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should create an order with a large quantity (boundary condition)', async () => {
    const mockOrder = {
      message: 'Order created successfully.',
      transactionId: 'txn-789',
      order: { id: 'abc-3', customerName: 'Bulk Corp', item: 'Keyboard', quantity: 1000, status: 'Pending', createdAt: '2026-01-01T00:00:00Z' }
    };
    orderService.createOrder.mockResolvedValue(mockOrder);

    const req = { body: { customerName: 'Bulk Corp', item: 'Keyboard', quantity: 1000 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should return 400 when customerName is missing', async () => {
    const req = { body: { item: 'Laptop', quantity: 1 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'customerName, item, and quantity are required.' });
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  // Invalid input - missing item
  it('should return 400 when item is missing', async () => {
    const req = { body: { customerName: 'Jane', quantity: 1 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  // Invalid input - missing quantity
  it('should return 400 when quantity is missing', async () => {
    const req = { body: { customerName: 'Jane', item: 'Laptop' } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  // Invalid input - quantity is zero (edge case)
  it('should return 400 when quantity is zero (edge case)', async () => {
    const req = { body: { customerName: 'Jane', item: 'Laptop', quantity: 0 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'quantity must be a positive number.' });
  });

  // Invalid input - quantity is negative (edge case)
  it('should return 400 when quantity is negative (edge case)', async () => {
    const req = { body: { customerName: 'Jane', item: 'Laptop', quantity: -5 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'quantity must be a positive number.' });
  });

  // Database error (mocked)
  it('should return 500 when the service throws a database error', async () => {
    orderService.createOrder.mockRejectedValue(new Error('Database connection failed.'));

    const req = { body: { customerName: 'Jane', item: 'Laptop', quantity: 1 } };
    const res = mockRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Internal server error.' }));
  });
});

// getAllOrders

describe('getAllOrders', () => {

  it('should return 200 with an array of orders', async () => {
    const mockOrders = [
      { id: 'abc-1', customerName: 'Jane', item: 'Laptop', quantity: 1, status: 'Pending', createdAt: '2026-01-01T00:00:00Z' }
    ];
    orderService.getAllOrders.mockResolvedValue(mockOrders);

    const req = {};
    const res = mockRes();

    await orderController.getAllOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOrders);
  });

  it('should return 200 with an empty array when no orders exist (edge case)', async () => {
    orderService.getAllOrders.mockResolvedValue([]);

    const req = {};
    const res = mockRes();

    await orderController.getAllOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should return 500 when the service throws a database error', async () => {
    orderService.getAllOrders.mockRejectedValue(new Error('Database connection failed.'));

    const req = {};
    const res = mockRes();

    await orderController.getAllOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Internal server error.' }));
  });
});

// getOrderById

describe('getOrderById', () => {

  it('should return 200 with the correct order when a valid ID is provided', async () => {
    const mockOrder = { id: 'abc-1', customerName: 'Jane', item: 'Laptop', quantity: 1, status: 'Pending', createdAt: '2026-01-01T00:00:00Z' };
    orderService.getOrderById.mockResolvedValue(mockOrder);

    const req = { params: { id: 'abc-1' } };
    const res = mockRes();

    await orderController.getOrderById(req, res);

    expect(orderService.getOrderById).toHaveBeenCalledWith('abc-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should return 404 when the order ID does not exist', async () => {
    orderService.getOrderById.mockResolvedValue(null);

    const req = { params: { id: 'non-existent-id' } };
    const res = mockRes();

    await orderController.getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order not found.' });
  });

  it('should return 500 when the service throws a database error', async () => {
    orderService.getOrderById.mockRejectedValue(new Error('Database connection failed.'));

    const req = { params: { id: 'abc-1' } };
    const res = mockRes();

    await orderController.getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Internal server error.' }));
  });
});

// updateOrderStatus

describe('updateOrderStatus', () => {

  it('should return 200 and update status with a valid status value', async () => {
    const mockOrder = { id: 'abc-1', customerName: 'Jane', item: 'Laptop', quantity: 1, status: 'Shipped', createdAt: '2026-01-01T00:00:00Z' };
    orderService.getOrderById.mockResolvedValue(mockOrder);
    orderService.updateOrderStatus.mockResolvedValue(mockOrder);

    const req = { params: { id: 'abc-1' }, body: { status: 'Shipped' } };
    const res = mockRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Order updated.' }));
  });

  it('should return 200 for each valid status value (boundary conditions)', async () => {
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    for (const status of validStatuses) {
      const mockOrder = { id: 'abc-1', status };
      orderService.getOrderById.mockResolvedValue(mockOrder);
      orderService.updateOrderStatus.mockResolvedValue(mockOrder);

      const req = { params: { id: 'abc-1' }, body: { status } };
      const res = mockRes();

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      jest.clearAllMocks();
    }
  });

  it('should return 400 when status is invalid', async () => {
    const req = { params: { id: 'abc-1' }, body: { status: 'Flying' } };
    const res = mockRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('should return 400 when status is missing (edge case)', async () => {
    const req = { params: { id: 'abc-1' }, body: {} };
    const res = mockRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when status is empty string (edge case)', async () => {
    const req = { params: { id: 'abc-1' }, body: { status: '' } };
    const res = mockRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 when order does not exist', async () => {
    orderService.getOrderById.mockResolvedValue(null);

    const req = { params: { id: 'non-existent' }, body: { status: 'Shipped' } };
    const res = mockRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('should return 500 when the service throws a database error', async () => {
    orderService.getOrderById.mockRejectedValue(new Error('Database connection failed.'));

    const req = { params: { id: 'abc-1' }, body: { status: 'Shipped' } };
    const res = mockRes();

    await orderController.updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// deleteOrder

describe('deleteOrder', () => {

  it('should return 200 and delete the order when a valid ID is provided', async () => {
    const mockOrder = { id: 'abc-1', customerName: 'Jane', item: 'Laptop', quantity: 1, status: 'Pending', createdAt: '2026-01-01T00:00:00Z' };
    orderService.getOrderById.mockResolvedValue(mockOrder);
    orderService.deleteOrder.mockResolvedValue();

    const req = { params: { id: 'abc-1' } };
    const res = mockRes();

    await orderController.deleteOrder(req, res);

    expect(orderService.deleteOrder).toHaveBeenCalledWith('abc-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Order deleted successfully.' });
  });

  it('should return 404 when the order does not exist', async () => {
    orderService.getOrderById.mockResolvedValue(null);

    const req = { params: { id: 'non-existent' } };
    const res = mockRes();

    await orderController.deleteOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(orderService.deleteOrder).not.toHaveBeenCalled();
  });

  it('should return 500 when the service throws a database error', async () => {
    orderService.getOrderById.mockRejectedValue(new Error('Database connection failed.'));

    const req = { params: { id: 'abc-1' } };
    const res = mockRes();

    await orderController.deleteOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});