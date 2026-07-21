# OrderManager — Microservices Decomposition

The monolith in `src/OrderManager.Api` is decomposed here into 4 independent
services + an API gateway. The monolith is left intact; these services are built
alongside it.

## Services & ports

| Service            | Port | Own DB          | DbContext           |
|--------------------|------|-----------------|---------------------|
| Customers          | 5101 | `customers.db`  | `CustomerDbContext` |
| Products           | 5102 | `products.db`   | `ProductDbContext`  |
| Inventory          | 5103 | `inventory.db`  | `InventoryDbContext`|
| Orders             | 5104 | `orders.db`     | `OrderDbContext`    |
| Gateway (YARP)     | 5100 | —               | —                   |

Each service owns its SQLite database seeded from the relevant slice of the
monolith's `SeedData`. Cross-service references (`CustomerId`, `ProductId`) are
stored as plain int columns — no cross-database foreign keys.

## Contract parity (locked decision)

Nested objects that the monolith produced via EF `Include` are re-assembled via
**cross-service HTTP calls** so responses match the baseline golden datasets in
`baseline/` byte-for-byte (after timestamp normalization). `Shared.Contracts`
holds the DTOs, which mirror the monolith's JSON shapes exactly — including the
`ReferenceHandler.IgnoreCycles` + EF navigation-fixup artifacts:

- **Order** read: `customer` present with `customer.orders == [null]`;
  `items[].order == null`; `items[].product` present with `product.inventory == null`
  and `product.orderItems == [null]`.
- **Product** read: `inventory` present with `inventory.product == null`; `orderItems == []`.
- **Inventory** read: `product` present with `product.inventory == null`, `product.orderItems == []`.
- **Customer** by-id: `orders[]` present, each with `customer == null`, `items == []`.
  Customer **list**: `orders == []`.

To avoid Product↔Inventory (and Customer↔Order) HTTP recursion, each service
exposes `internal/*` endpoints returning the *base* entity (no composition);
composing services call those and then apply the exact nesting/null shape.

A cross-service composition failure surfaces as an error (5xx) and never a
partially-populated, shape-changing success body.

## Shared.Contracts

- DTOs mirroring the monolith JSON shapes (property order preserved).
- Typed, resilient `HttpClient`s (`CustomersClient`, `ProductsClient`,
  `InventoryClient`, `OrdersClient`) with auth-header forwarding + retry/timeout
  (`AuthForwardingHandler` + `RetryHandler`).
- JWT auth + restricted CORS extensions (`AddJwtAuth`, `AddRestrictedCors`) and a
  `JwtTokenFactory` used by the gateway.

## Auth

The gateway issues JWTs at `POST /auth/token` after validating credentials
against the configured user store (`Auth:Users`; dev defaults `demo`/`web`/`baseline`),
and requires a valid bearer token on every proxied `/api/*` route; each service
also validates the token (`AddAuthentication(JwtBearer)` + `[Authorize]`). CORS
is restricted to the gateway/frontend origin instead of `AllowAnyOrigin`.

The HS256 signing key is **required** — there is no in-source fallback. Provide
the same key to the gateway and every service via `Jwt__Key` (env) / `Jwt:Key`
(config); a missing key fails fast at startup. `run-all.sh` and `docker-compose.yml`
set a shared local-dev key automatically (override by exporting `Jwt__Key` / `JWT_KEY`).

## Run locally

```bash
# Native (tested): boots all 5 processes with fresh DBs
./services/run-all.sh --fresh
# ... then stop with:
./services/stop-all.sh

# Or via containers:
docker compose -f services/docker-compose.yml up --build
```

Get a token:

```bash
curl -s -X POST http://localhost:5100/auth/token \
  -H 'Content-Type: application/json' -d '{"username":"demo","password":"demo"}'
```

## Parity check

```bash
./services/run-all.sh --fresh
./baseline/run-baseline.sh http://localhost:5100   # exit 0 == byte-for-byte parity
```

The Angular client (`client-app`) targets the gateway via
`environment.apiUrl` and attaches the JWT through an HTTP interceptor.
