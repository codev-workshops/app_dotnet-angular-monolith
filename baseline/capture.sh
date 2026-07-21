#!/usr/bin/env bash
# Capture golden JSON for every read endpoint against a running stack.
#
# Usage: capture.sh <base_url> <out_dir>
#   base_url : e.g. http://localhost:5000 (monolith) or http://localhost:5100 (gateway)
#   out_dir  : directory to write normalized *.json + status.txt into
#
# The target stack MUST be freshly seeded (no pre-existing orders) so IDs are
# deterministic. The script creates one deterministic order to exercise the
# order-composition read paths, then snapshots all read endpoints.
set -euo pipefail

BASE_URL="${1:?base_url required}"
OUT_DIR="${2:?out_dir required}"
TOKEN="${AUTH_TOKEN:-}"           # optional bearer token (gateway/JWT stack)
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

AUTH=()
[ -n "$TOKEN" ] && AUTH=(-H "Authorization: Bearer $TOKEN")

mkdir -p "$OUT_DIR"
: > "$OUT_DIR/status.txt"

norm() { jq -f "$HERE/norm.jq"; }

# GET a path, normalize the JSON body into out_dir/<name>.json,
# and record "<name> <http_status>" into status.txt
snap() {
  local name="$1" path="$2"
  local body status
  body="$(curl -s "${AUTH[@]}" -w $'\n%{http_code}' "$BASE_URL$path")"
  status="${body##*$'\n'}"
  body="${body%$'\n'*}"
  echo "$name $status" >> "$OUT_DIR/status.txt"
  if [ -n "$body" ]; then
    printf '%s' "$body" | norm > "$OUT_DIR/$name.json"
  else
    printf '' > "$OUT_DIR/$name.json"
  fi
}

# record status code only (for error-behavior parity)
code() {
  local name="$1" method="$2" path="$3" data="${4:-}"
  local status
  if [ "$method" = "GET" ]; then
    status="$(curl -s -o /dev/null -w '%{http_code}' "${AUTH[@]}" "$BASE_URL$path")"
  else
    status="$(curl -s -o /dev/null -w '%{http_code}' "${AUTH[@]}" -X "$method" \
      -H 'Content-Type: application/json' -d "$data" "$BASE_URL$path")"
  fi
  echo "$name $status" >> "$OUT_DIR/status.txt"
}

echo "==> Seeding deterministic order against $BASE_URL"
curl -s "${AUTH[@]}" -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -d '{"customerId":1,"items":[{"productId":1,"quantity":2},{"productId":3,"quantity":1}]}' \
  > /dev/null

echo "==> Capturing read endpoints"
# Customers
snap customers_list            /api/customers
snap customer_1                /api/customers/1
snap customer_2                /api/customers/2
# Products
snap products_list             /api/products
snap product_1                 /api/products/1
snap products_cat_widgets      /api/products/category/Widgets
snap products_cat_gadgets      /api/products/category/Gadgets
# Inventory
snap inventory_list            /api/inventory
snap inventory_product_1       /api/inventory/product/1
snap inventory_low_stock       /api/inventory/low-stock
# Orders
snap orders_list               /api/orders
snap order_1                   /api/orders/1

echo "==> Capturing error/status behavior"
code order_404          GET  /api/orders/999
code customer_404       GET  /api/customers/999
code inventory_404      GET  /api/inventory/product/999
code create_bad_customer POST /api/orders '{"customerId":999,"items":[{"productId":1,"quantity":1}]}'
code create_bad_product  POST /api/orders '{"customerId":1,"items":[{"productId":999,"quantity":1}]}'
code create_insufficient POST /api/orders '{"customerId":1,"items":[{"productId":1,"quantity":999999}]}'

sort -o "$OUT_DIR/status.txt" "$OUT_DIR/status.txt"
echo "==> Done. Wrote $(ls -1 "$OUT_DIR"/*.json | wc -l) json snapshots to $OUT_DIR"
