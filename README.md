# EDOP — E-commerce Microservices Platform

A full-stack e-commerce application built with a **microservices architecture** using Node.js, PostgreSQL, RabbitMQ, Redis, and Elasticsearch.

---

## 🏗️ Architecture Overview

```
client (React + Vite)
       │
       ▼
api-gateway  (:5000)
       │
  ┌────┴────────────────┐
  ▼                     ▼
inventory-service     order-service
   (:5002)               (:5003)
  [PostgreSQL]         [PostgreSQL]
  [Elasticsearch]      [Elasticsearch]
  [RabbitMQ]           [RabbitMQ]
       │                     │
       └────────┬────────────┘
                ▼
     notification-service
       (email alerts)
```

---

## 📦 Services

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 5000 | Routes requests, validates JWT |
| `auth-service` | 5001 | Login, register, JWT issuance |
| `inventory-service` | 5002 | Product CRUD + image upload + ES search |
| `order-service` | 5003 | Checkout, order management + ES search |
| `notification-service` | — | Sends email on order events via RabbitMQ |
| `client` | 5173 | React frontend |

---

## 🔍 Fuzzy Search with Elasticsearch

This is the main feature added in this session. Both `inventory-service` and `order-service` use **Elasticsearch** to provide typo-tolerant fuzzy search.

### How It Works

When you type in a search box, the query is sent to Elasticsearch using a `multi_match` query with `fuzziness: "AUTO"`:

```js
esClient.search({
  index: "products",
  body: {
    query: {
      multi_match: {
        query: "lapto",          // user typed with typo
        fields: ["name^2", "description"],
        fuzziness: "AUTO",       // finds "Laptop" automatically
      },
    },
  },
});
```

**`fuzziness: "AUTO"` tolerance rules:**
| Word length | Typos allowed |
|---|---|
| 1–2 characters | Exact match only |
| 3–5 characters | 1 typo |
| 6+ characters | 2 typos |

So `phne` → finds `Phone`, `johnn` → finds `John`, `lapto` → finds `Laptop`.

### Indexing Strategy

Every time a product or order is **created, updated, or deleted**, it is automatically synced to Elasticsearch in the background (non-blocking — the HTTP response is not delayed):

```js
// After saving to PostgreSQL:
indexProduct(result.rows[0]);  // fire-and-forget to ES
```

---

## 🔌 Search API Endpoints

### Products (public)
```
GET /api/products/search?q=<term>
```
**Example:**
```
GET /api/products/search?q=wirelss headphon
```
Returns products matching the query even with typos.

### Orders (admin only)
```
GET /api/orders/search?q=<term>&status=<STATUS>
```
**Examples:**
```
GET /api/orders/search?q=john
GET /api/orders/search?q=john doe&status=PENDING
GET /api/orders/search?status=DELIVERED
```
Searches across customer name, email, address, and product names inside the order.

---

## 🖥️ UI — Search Bars

### Homepage (Customer View)
- Search bar appears **above the products grid**
- **Debounced** — waits 400ms after you stop typing before calling ES
- Shows a spinner while searching
- Clears back to all products when the input is emptied
- Typos are tolerated automatically

### Admin Dashboard — Orders Tab
- Search bar in the **top-right of the orders table**
- Same debounced ES fuzzy search
- Searches by customer name, email, address, or product name
- Clears back to all orders when emptied

### Admin Dashboard — Inventory Tab
- Search bar in the **top-right of the products table**
- Instant **local filter** (no network call, filters the already-loaded list)

---

## ⚙️ Prerequisites

Make sure all of the following are running before starting the services:

| Dependency | Default URL |
|---|---|
| PostgreSQL | `localhost:5432` |
| RabbitMQ | `amqp://localhost` |
| Redis | `localhost:6379` |
| **Elasticsearch** | `http://localhost:9200` |

### Start Elasticsearch (Docker — easiest)
```bash
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.13.0
```

Verify it's running:
```bash
curl http://localhost:9200
```

---

## 🚀 Running the Project

### 1. Install dependencies in each service
```bash
cd inventory-service && npm install
cd ../order-service    && npm install
cd ../client           && npm install
# repeat for api-gateway, auth-service, notification-service
```

### 2. Configure environment variables

Each service has its own `.env`. The key variable added for Elasticsearch:
```env
ELASTICSEARCH_URL=http://localhost:9200
```

### 3. Start all services
```bash
# In separate terminals:
cd api-gateway          && npm run dev
cd auth-service         && npm run dev
cd inventory-service    && npm run dev
cd order-service        && npm run dev
cd notification-service && npm run dev
cd client               && npm run dev
```

The Elasticsearch index (`products` and `orders`) is **created automatically** on service startup if it doesn't exist.

---

## 📁 Files Changed for Elasticsearch Search

```
inventory-service/
  src/
    config/
      elasticsearch.js          ← ES client + index init
    controllers/
      product.controller.js     ← indexProduct() helper + searchProducts()
    routes/
      product.routes.js         ← GET /search route added
  .env                          ← ELASTICSEARCH_URL added

order-service/
  src/
    config/
      elasticsearch.js          ← ES client + index init
    controllers/
      order.controller.js       ← indexOrder() helper + searchOrders()
    routes/
      order.routes.js           ← GET /search route added
  .env                          ← ELASTICSEARCH_URL added

client/
  src/
    api/
      products.js               ← searchProducts() added
      orders.js                 ← searchOrders() added
    pages/
      HomePage.jsx              ← search bar + debounced ES search
      AdminDashboard.jsx        ← search bars for products and orders
```

---

## 🔑 Authentication

- JWT is issued by `auth-service` and stored in an **HTTP-only cookie**
- The `api-gateway` validates the cookie on every request
- Admin-only routes (product create/update/delete, all orders, order search) require the `role = admin` claim in the token

---

## 📬 RabbitMQ Events

| Event | Publisher | Consumer |
|---|---|---|
| `order.placed` | order-service | inventory-service (reserves stock) |
| `order.notification.placed` | order-service | notification-service (sends email) |
| `order.notification.cancelled` | order-service | notification-service |
| `order.notification.delivered` | order-service | notification-service |
