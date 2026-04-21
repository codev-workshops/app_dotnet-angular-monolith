# OrderManager Microservices

Decomposed Java (Spring Boot) microservices + React (Vite + TypeScript) frontend migrated from the .NET 8 + Angular 17 monolith.

## Architecture

```
                          ┌─────────────┐
                          │   React UI  │
                          │  (Vite+TS)  │
                          │   :5173     │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │ API Gateway │
                          │   :8080     │
                          └──────┬──────┘
                                 │
          ┌──────────┬───────────┼───────────┬──────────┐
          │          │           │           │          │
   ┌──────▼──┐ ┌────▼────┐ ┌───▼───┐ ┌─────▼───┐ ┌───▼────────┐
   │  Auth   │ │Customer │ │Product│ │  Order  │ │ Inventory  │
   │ :8081   │ │ :8082   │ │ :8083 │ │  :8084  │ │   :8085    │
   └─────────┘ └─────────┘ └───────┘ └─────────┘ └────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8080 | Spring Cloud Gateway — routes to all downstream services |
| auth-service | 8081 | JWT authentication, user & role management |
| customer-service | 8082 | Customer CRUD |
| product-service | 8083 | Product CRUD, category filtering |
| order-service | 8084 | Order CRUD, status updates (calls customer + product services) |
| inventory-service | 8085 | Inventory CRUD, restock, low-stock alerts (calls product service) |
| frontend | 5173 | React + Vite + TypeScript UI |

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.2, Spring Data JPA, SQLite
- **Auth**: Spring Security + JWT (BCrypt password hashing)
- **Gateway**: Spring Cloud Gateway
- **Frontend**: React 18, Vite, TypeScript, React Router, React-Bootstrap
- **Database**: SQLite (each service owns its own database file)

## Getting Started

### Run with Docker Compose

```bash
cd microservices
docker-compose up --build
```

### Run Individually

Start services in this order:

```bash
# 1. Auth Service
cd auth-service && ./mvnw spring-boot:run

# 2. Domain Services (can run in parallel)
cd customer-service && ./mvnw spring-boot:run
cd product-service && ./mvnw spring-boot:run
cd order-service && ./mvnw spring-boot:run
cd inventory-service && ./mvnw spring-boot:run

# 3. API Gateway
cd api-gateway && ./mvnw spring-boot:run

# 4. Frontend
cd frontend && npm install && npm run dev
```

### Default Credentials

- **Admin**: admin / admin123

## API Routes (via Gateway at :8080)

- `POST /api/auth/login` — Get JWT token
- `POST /api/auth/refresh` — Refresh JWT token
- `GET/POST /api/users` — User management
- `GET/POST /api/roles` — Role management
- `GET/POST /api/customers` — Customer CRUD
- `GET/POST /api/products` — Product CRUD
- `GET /api/products/category/{category}` — Filter by category
- `GET/POST /api/orders` — Order CRUD
- `PATCH /api/orders/{id}/status` — Update order status
- `GET /api/inventory` — Inventory list
- `GET /api/inventory/low-stock` — Low stock alerts
- `POST /api/inventory/product/{id}/restock` — Restock product

## Seed Data

- **Customers**: Acme Corp, Globex Inc, Initech LLC
- **Products**: Widget A, Widget B, Gadget X, Gadget Y, Thingamajig
- **Inventory**: 50-250 units per product
- **Users**: admin (ADMIN role)
