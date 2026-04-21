# Comparison Tests

Compares API responses from the .NET monolith and the Java microservices to verify data parity during the OrderManager migration.

## Prerequisites

- Python 3.8+
- The .NET monolith running (default: `https://localhost:5001`)
- The microservices gateway running (default: `http://localhost:8080`)
- The auth service running (default: `http://localhost:8081`)

## Setup

```bash
pip install -r requirements.txt
```

## Usage

Set the auth password via environment variable:

```bash
export AUTH_PASSWORD="your-password"
python compare.py
```

Or pass it as a command-line argument:

```bash
python compare.py --auth-password "your-password"
```

Run with custom URLs:

```bash
python compare.py \
  --monolith-url https://localhost:5001 \
  --microservices-url http://localhost:8080 \
  --auth-url http://localhost:8081 \
  --auth-username admin \
  --auth-password "your-password"
```

Specify a custom report output path:

```bash
python compare.py --report /path/to/report.md
```

## What It Compares

| Endpoint | Match Key | Compared Fields |
|----------|-----------|-----------------|
| `GET /api/customers` | `email` | name, email, phone, address, city, state, zipCode |
| `GET /api/products` | `sku` | name, description, category, price, sku |
| `GET /api/inventory` | `productId` | productId, quantityOnHand, reorderLevel, warehouseLocation |

Fields ignored during comparison: `id`, `createdAt`, `updatedAt`, `orders`, `inventory`.

Orders are excluded because the microservices start fresh with no order data.

## Output

- **Console**: JSON diff for each endpoint printed to stdout.
- **Report**: Markdown summary written to `comparison-report.md` (or the path specified via `--report`).
- **Exit code**: `0` if all records match, `1` if any discrepancies are found.

## Authentication

The monolith has no authentication. The microservices require JWT authentication. The script automatically logs in via `POST /api/auth/login` using the default admin credentials.
