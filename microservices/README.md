# OrderManager Microservices

Decomposition of the .NET OrderManager monolith into Java Spring Boot microservices with a React (Vite + TypeScript) frontend.

## Architecture

```
                         ┌──────────────┐
                         │   Frontend   │
                         │  React+Vite  │
                         │  :5173       │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │ API Gateway  │
                         │ Spring Cloud │
                         │  :8080       │
                         └──────┬───────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        │           │           │           │           │
  ┌─────▼─────┐ ┌──▼────────┐ ┌▼─────────┐ ┌▼────────┐ ┌▼──────────┐
  │   Auth    │ │ Customer  │ │ Product  │ │ Order   │ │ Inventory │
  │  Service  │ │  Service  │ │ Service  │ │ Service │ │  Service  │
  │  :8081    │ │  :8082    │ │  :8083   │ │  :8084  │ │  :8085    │
  └───────────┘ └───────────┘ └──────────┘ └─────────┘ └───────────┘
```

## Services

| Service | Port | Description |
|---|---|---|
| api-gateway | 8080 | Spring Cloud Gateway — routes requests to downstream services |
| auth-service | 8081 | JWT authentication, user and role management |
| customer-service | 8082 | Customer CRUD operations |
| product-service | 8083 | Product CRUD + category filtering |
| order-service | 8084 | Order CRUD + status updates (calls customer/product/inventory services) |
| inventory-service | 8085 | Inventory management, restocking, low-stock alerts |
| frontend | 5173 | React + Vite + TypeScript UI |

## Database

Each service uses its own SQLite database file, ensuring data isolation per the microservices pattern.

## Quick Start

### With Docker Compose
```bash
cd microservices
docker-compose up --build
```

### Individual Services
```bash
# Start auth-service first
cd auth-service && mvn spring-boot:run

# Then domain services (in any order)
cd customer-service && mvn spring-boot:run
cd product-service && mvn spring-boot:run
cd order-service && mvn spring-boot:run
cd inventory-service && mvn spring-boot:run

# Then gateway
cd api-gateway && mvn spring-boot:run

# Then frontend
cd frontend && npm install && npm run dev
```

## Default Credentials

- **Admin**: admin / admin123

## Seed Data

- 3 customers: Acme Corp, Globex Inc, Initech LLC
- 5 products: Widget A, Widget B, Gadget X, Gadget Y, Thingamajig
- 5 inventory records with stock levels 50-250
- 1 admin user with ADMIN role

## Cross-Service Communication

- order-service → customer-service (shipping address lookup)
- order-service → product-service (price lookup)
- order-service → inventory-service (stock check/deduction)
- inventory-service → product-service (product name display)

All inter-service calls use direct HTTP (RestTemplate) with service-to-service URLs.

## Frontend

The `frontend/` directory contains a React SPA built with:

- **React 18** + **Vite** + **TypeScript**
- **React Router v6** for client-side routing
- **React-Bootstrap** + Bootstrap 5 for UI components
- **Axios** with JWT interceptors and automatic token refresh

### Pages

| Route | Page | Description |
|---|---|---|
| `/` | Login | Username/password authentication |
| `/dashboard` | Dashboard | Summary cards (customers, products, orders, low-stock) |
| `/orders` | Orders | Order table with create modal and inline status editing |
| `/products` | Products | Product table with create modal |
| `/customers` | Customers | Customer table with create modal |
| `/inventory` | Inventory | Inventory table with low-stock highlighting and restock modal |
| `/settings` | Settings | User management and role management tabs |
| `/about` | About | Architecture description and tech stack info |

### Development

```bash
cd microservices/frontend
npm install
npm run dev     # starts dev server on http://localhost:5173
npm run build   # production build to dist/
```

The frontend connects to the API Gateway at `http://localhost:8080` by default. Override with the `VITE_API_URL` environment variable.

## Comparison Tests

The `comparison-tests/` directory contains a Python script that compares API responses between the .NET monolith and the Java microservices to verify data parity during migration. See [comparison-tests/README.md](comparison-tests/README.md) for details.
