# Order Management API

A RESTful API built with Node.js, Express.js, and SQLite for managing e-commerce orders. This repository includes Ansible playbooks for automated deployment to a remote server.

## Prerequisites

- Ansible installed on your local machine (`brew install ansible` on Mac)
- An Ubuntu 22.04 server (AWS EC2 t2.micro recommended)
- SSH key pair with access to the server
- Node.js v20 (installed automatically by the playbook)

## Ansible Deployment

### Run the deployment playbook:
```bash
ansible-playbook -i "YOUR_SERVER_IP," -u ubuntu --private-key ~/.ssh/order-management-key.pem deploy.yml
```

### Run the rollback playbook:
```bash
ansible-playbook -i "YOUR_SERVER_IP," -u ubuntu --private-key ~/.ssh/order-management-key.pem rollback.yml
```

## Accessing the Application

After deployment, the API is available at:
```
http://YOUR_SERVER_IP:3000
```

Make sure port 3000 is open in your server's firewall or AWS security group.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Create a new order |
| GET | /orders | Retrieve all orders |
| GET | /orders/:id | Retrieve a specific order |
| PATCH | /orders/:id | Update order status |
| DELETE | /orders/:id | Delete an order |

## Running Verification Tests

```bash
chmod +x test.sh
./test.sh YOUR_SERVER_IP
```

This runs three tests: GET /orders (200 OK), POST /orders (201 Created), and GET with invalid ID (404 Not Found).

## Local Development

```bash
npm install
npm start
```

API runs at `http://localhost:3000`

## Known Issues and Limitations

- The SQLite database file (orders.db) is stored locally on the server. It is not backed up automatically.
- The deployment uses PostgreSQL installed on the server, but the app itself uses SQLite via better-sqlite3 for data storage.
- If the playbook fails mid-run, run rollback.yml first before attempting to redeploy.
- The .pem key file must have permissions set to 400 (`chmod 400 your-key.pem`) or SSH will reject it.