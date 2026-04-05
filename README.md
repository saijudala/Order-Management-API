# Order Management API

A RESTful API built with Node.js, Express.js, and SQLite for managing e-commerce orders.

## Setup Instructions

1. Clone or unzip the project folder
2. Run `npm install`
3. Run `node app.js`
4. API is available at `http://localhost:3000`

## Endpoints

### POST /orders
Creates a new order. Simulates a payment gateway using async/await with a Promise-based delay.

**Request Body:**
```json
{ "customerName": "Jane Doe", "item": "Laptop", "quantity": 1 }
```
**Response (201):**
```json
{ "message": "Order created successfully.", "transactionId": "abc-123", "order": { ... } }
```

---

### GET /orders
Returns all orders.
**Response (200):** Array of order objects.

---

### GET /orders/:id
Returns a single order by ID.
**Response (200):** Order object.
**Response (404):** `{ "error": "Order not found." }`

---

### PATCH /orders/:id
Updates the status of an order.

**Request Body:**
```json
{ "status": "Shipped" }
```
Valid statuses: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`
**Response (200):** Updated order object.

---

### DELETE /orders/:id
Deletes an order by ID.
**Response (200):** `{ "message": "Order deleted successfully." }`

## Status Codes Used
| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 400  | Bad Request |
| 404  | Not Found |
| 500  | Internal Server Error |