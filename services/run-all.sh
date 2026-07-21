#!/usr/bin/env bash
# Boot the full microservice stack (4 services + gateway) locally.
#
# Usage: run-all.sh [--fresh]
#   --fresh   delete each service's SQLite DB first (deterministic seed / parity)
#
# Services listen on: customers 5101, products 5102, inventory 5103,
# orders 5104, gateway 5100. Logs + PIDs are written under services/.run/.
# Stop everything with stop-all.sh.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

if [ "${1:-}" = "--fresh" ]; then
  echo "Removing existing service databases"
  rm -f Customers/customers.db* Products/products.db* Inventory/inventory.db* Orders/orders.db*
fi

# Shared HS256 signing key for the gateway + all services (local dev default).
# Override by exporting Jwt__Key before running. Every process must share it.
export Jwt__Key="${Jwt__Key:-local-dev-jwt-signing-key-change-me-please-32bytes+}"

mkdir -p .run/logs

echo "Building solution"
dotnet build Services.sln -v q

start() {
  local name="$1" proj="$2"
  dotnet run --project "$proj" --no-build > ".run/logs/$name.log" 2>&1 &
  echo $! > ".run/$name.pid"
  echo "  started $name (pid $(cat ".run/$name.pid"))"
}

echo "Starting services"
start customers Customers/Customers.Api.csproj
start products  Products/Products.Api.csproj
start inventory Inventory/Inventory.Api.csproj
start orders    Orders/Orders.Api.csproj
start gateway   Gateway/Gateway.csproj

echo "Waiting for health checks"
for port in 5101 5102 5103 5104 5100; do
  for i in $(seq 1 40); do
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1; then
      echo "  :$port healthy"; break
    fi
    if [ "$i" = 40 ]; then echo "  :$port FAILED to become healthy"; fi
    sleep 0.5
  done
done

echo
echo "Stack is up. Gateway: http://localhost:5100"
echo "Get a token:   curl -s -X POST http://localhost:5100/auth/token -H 'Content-Type: application/json' -d '{\"username\":\"demo\",\"password\":\"demo\"}'"
echo "Stop:          $HERE/stop-all.sh"
