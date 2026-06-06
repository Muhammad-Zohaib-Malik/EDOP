# EDOP E-Commerce Platform

EDOP is a modern, scalable e-commerce platform built using a microservices architecture. It leverages an event-driven approach using RabbitMQ to ensure seamless communication across different services.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Microservices Overview](#microservices-overview)
- [Prerequisites](#prerequisites)
- [How to Run the Project](#how-to-run-the-project)
- [Environment Variables (.env Structure)](#environment-variables-env-structure)

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Relational Data)
- **Search Engine**: Elasticsearch (High-performance search/filtering)
- **Message Broker**: RabbitMQ (Asynchronous Event-Driven Architecture)
- **Third-Party Integrations**: Stripe (Payments), Resend (Emails)

## Architecture

The platform uses an **Event-Driven Microservices Architecture**:

- **API Gateway**: Acts as the single entry point for all client requests, routing them to the appropriate backend services.
- **Message Broker (RabbitMQ)**: Facilitates asynchronous communication. For example, when a payment succeeds, the `payment-service` publishes an event that the `order-service` consumes to update the database, which then publishes an event for the `notification-service` to send an email.
- **Database (PostgreSQL)**: The primary relational database used by the services (e.g., storing orders, payments).
- **Search Engine (Elasticsearch)**: Used by the order/inventory services for high-performance search queries.
- **External APIs**:
  - **Stripe**: Handles secure checkout and payment processing.
  - **Resend**: Handles transactional email notifications to customers.

```mermaid
graph TD
    Client[Frontend / Client] -->|HTTP Requests| API_Gateway[API Gateway]

    API_Gateway --> Auth[Auth Service]
    API_Gateway --> Inventory[Inventory Service]
    API_Gateway --> Order[Order Service]
    API_Gateway --> Payment[Payment Service]

    Payment -->|Stripe Webhook| Stripe[Stripe API]
    Payment -->|payment.success| RMQ((RabbitMQ))

    RMQ -->|Consumes| Order
    Order -->|order.notification.paid| RMQ

    RMQ -->|Consumes| Notification[Notification Service]
    Notification -->|Sends Email| Resend[Resend API]

    Order -->|Reads/Writes| PG[(PostgreSQL)]
    Order -->|Syncs| ES[(Elasticsearch)]
```

## Microservices Overview

1. **`api-gateway`**: Routes incoming HTTP traffic to the correct downstream services.
2. **`auth-service`**: Handles user registration, login, and JWT authentication.
3. **`inventory-service`**: Manages products, stock levels, and catalog management.
4. **`order-service`**: Handles order creation, processing, and database syncing with Elasticsearch.
5. **`payment-service`**: Integrates with Stripe for checkout sessions and webhook processing.
6. **`notification-service`**: Listens for RabbitMQ events to send transactional emails (placed, paid, cancelled, delivered) using Resend.

## Prerequisites

To run this project locally, you will need:

- [Node.js](https://nodejs.org/) (v16+)
- [PostgreSQL](https://www.postgresql.org/)
- [RabbitMQ](https://www.rabbitmq.com/) (Local or CloudAMQP)
- [Elasticsearch](https://www.elastic.co/elasticsearch/)
- A [Stripe](https://stripe.com/) account
- A [Resend](https://resend.com/) account

## How to Run the Project

Since this is a microservices architecture, you need to run each service individually, or you can use tools like `concurrently` or `pm2` to run them together.

### 1. Install Dependencies

Navigate into each service folder and install the NPM packages:

```bash
cd auth-service && npm install
cd ../api-gateway && npm install
cd ../inventory-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install
cd ../notification-service && npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root of **each** microservice directory. See the [.env structure](#environment-variables-env-structure) below for details.

### 3. Start the Services

Open separate terminal windows for each service (or use a tool like VS Code terminal splitting) and run:

```bash
# In each service directory:
npm run dev
```

_(Ensure your API Gateway is running so it can route your frontend requests to the correct ports)._

## Environment Variables (.env Structure)

Below are the typical environment variable templates required for each service. You must create a `.env` file in each respective service folder.

### `notification-service/.env`

```env
PORT=5004
RABBITMQ_URL=amqps://your_rabbitmq_url
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="EDOP Ecommerce <hello@yourdomain.tech>"
```

### `payment-service/.env`

```env
PORT=5003
RABBITMQ_URL=amqps://your_rabbitmq_url
DATABASE_URL=postgres://user:password@localhost:5432/edop_db
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:5173
```

### `order-service/.env`

```env
PORT=5002
RABBITMQ_URL=amqps://your_rabbitmq_url
DATABASE_URL=postgres://user:password@localhost:5432/edop_db
ELASTICSEARCH_URL=http://localhost:9200
```

### `auth-service/.env`

```env
PORT=5001
DATABASE_URL=postgres://user:password@localhost:5432/edop_db
JWT_SECRET=your_super_secret_jwt_key
```

### `inventory-service/.env`

```env
PORT=5005
DATABASE_URL=postgres://user:password@localhost:5432/edop_db
ELASTICSEARCH_URL=http://localhost:9200
```

### `api-gateway/.env`

```env
PORT=5000
AUTH_SERVICE_URL=http://localhost:5001
ORDER_SERVICE_URL=http://localhost:5002
PAYMENT_SERVICE_URL=http://localhost:5003
NOTIFICATION_SERVICE_URL=http://localhost:5004
INVENTORY_SERVICE_URL=http://localhost:5005
```

_(Note: The exact variable names may vary depending on your specific code, but this structure covers the core dependencies)._
