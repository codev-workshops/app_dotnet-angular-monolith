# Comparison Tests

Compares API responses from the .NET monolith with the Java microservices to verify data parity during the OrderManager migration.

## Prerequisites

- Python 3.8+
- The monolith running (default: `https://localhost:5001`)
- The microservices running via API Gateway (default: `http://localhost:8080`)

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
# With defaults (monolith=https://localhost:5001, microservices=http://localhost:8080)
python compare.py

# With custom URLs
python compare.py --monolith-url https://localhost:5001 --microservices-url http://localhost:8080
```

## What It Does

1. **Fetches monolith data** — `GET /api/{customers,products,orders,inventory}` (no auth)
2. **Authenticates with microservices** — `POST /api/auth/login` to obtain a JWT
3. **Fetches microservices data** — `GET /api/{customers,products,orders,inventory}` with `Authorization: Bearer <token>`
4. **Compares records** field-by-field, matching by key (email for customers, SKU for products, productId for inventory)
5. **Generates reports**:
   - `comparison-report.json` — structured diff data
   - `comparison-report.md` — human-readable summary with tables

## Compared Fields

| Endpoint   | Match Key  | Fields                                                               |
|------------|-----------|----------------------------------------------------------------------|
| Customers  | email     | name, email, phone, address, city, state, zipCode                    |
| Products   | sku       | name, description, category, price, sku                              |
| Inventory  | productId | productId, quantityOnHand, reorderLevel, warehouseLocation           |
| Orders     | —         | Skipped (no seed orders exist in the monolith)                       |

## Exit Codes

- `0` — All comparisons pass
- `1` — One or more discrepancies found, or a connection/auth error occurred

## Project Structure

```
comparison-tests/
├── requirements.txt   # Python dependencies (requests)
├── compare.py         # Main comparison script
└── README.md          # This file
```
