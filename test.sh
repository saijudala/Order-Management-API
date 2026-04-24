#!/bin/bash
# Usage: ./test.sh YOUR_EC2_IP

IP=$1

if [ -z "$IP" ]; then
  echo "Usage: ./test.sh <server-ip>"
  exit 1
fi

echo "Running verification tests against http://$IP:3000"
echo "---------------------------------------------------"

# Test 1: GET /orders returns 200
response=$(curl -s -o /dev/null -w "%{http_code}" http://$IP:3000/orders)
if [ "$response" == "200" ]; then
  echo "PASS: GET /orders returned 200 OK"
else
  echo "FAIL: GET /orders returned $response"
fi

# Test 2: POST /orders returns 201
post_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test User","item":"Laptop","quantity":1}' \
  http://$IP:3000/orders)
if [ "$post_response" == "201" ]; then
  echo "PASS: POST /orders returned 201 Created"
else
  echo "FAIL: POST /orders returned $post_response"
fi

# Test 3: GET /orders/invalid-id returns 404
error_response=$(curl -s -o /dev/null -w "%{http_code}" http://$IP:3000/orders/fake-id-999)
if [ "$error_response" == "404" ]; then
  echo "PASS: GET /orders/fake-id-999 returned 404 Not Found"
else
  echo "FAIL: GET /orders/fake-id-999 returned $error_response"
fi

echo "---------------------------------------------------"
echo "Tests complete."
