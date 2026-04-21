#!/usr/bin/env python3
"""
Comparison Tests for OrderManager Migration

Compares API responses from the .NET monolith and the Java microservices
to verify data parity during migration.
"""

import argparse
import json
import os
import sys
from datetime import datetime

import requests
from deepdiff import DeepDiff

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MONOLITH_DEFAULT_URL = "https://localhost:5001"
MICROSERVICES_DEFAULT_URL = "http://localhost:8080"
AUTH_SERVICE_URL = "http://localhost:8081"

ENDPOINTS = {
    "customers": {
        "path": "/api/customers",
        "match_key": "email",
        "compare_fields": [
            "name", "email", "phone", "address", "city", "state", "zipCode",
        ],
    },
    "products": {
        "path": "/api/products",
        "match_key": "sku",
        "compare_fields": [
            "name", "description", "category", "price", "sku",
        ],
    },
    "inventory": {
        "path": "/api/inventory",
        "match_key": "productId",
        "compare_fields": [
            "productId", "quantityOnHand", "reorderLevel", "warehouseLocation",
        ],
    },
}

IGNORE_FIELDS = {"id", "createdAt", "updatedAt", "orders", "inventory"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def parse_args():
    parser = argparse.ArgumentParser(
        description="Compare monolith and microservices API responses."
    )
    parser.add_argument(
        "--monolith-url",
        default=MONOLITH_DEFAULT_URL,
        help=f"Base URL for the .NET monolith (default: {MONOLITH_DEFAULT_URL})",
    )
    parser.add_argument(
        "--microservices-url",
        default=MICROSERVICES_DEFAULT_URL,
        help=f"Base URL for the microservices gateway (default: {MICROSERVICES_DEFAULT_URL})",
    )
    parser.add_argument(
        "--auth-url",
        default=AUTH_SERVICE_URL,
        help=f"Base URL for the auth service (default: {AUTH_SERVICE_URL})",
    )
    parser.add_argument(
        "--report",
        default="comparison-report.md",
        help="Path for the Markdown summary report (default: comparison-report.md)",
    )
    parser.add_argument(
        "--auth-username",
        default=os.environ.get("AUTH_USERNAME", "admin"),
        help="Username for microservices auth (default: admin or AUTH_USERNAME env var)",
    )
    parser.add_argument(
        "--auth-password",
        default=os.environ.get("AUTH_PASSWORD", ""),
        help="Password for microservices auth (reads AUTH_PASSWORD env var by default)",
    )
    return parser.parse_args()


def get_jwt_token(auth_url: str, username: str, password: str) -> str:
    """Authenticate with the microservices auth service and return a JWT."""
    url = f"{auth_url}/api/auth/login"
    credentials = {"username": username, "password": password}
    try:
        resp = requests.post(url, json=credentials, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        token = data.get("token") or data.get("access_token") or data.get("jwt")
        if not token:
            print(f"[ERROR] No token found in auth response: {data}")
            sys.exit(1)
        return token
    except requests.exceptions.ConnectionError:
        print(f"[ERROR] Cannot connect to auth service at {url}")
        sys.exit(1)
    except requests.exceptions.HTTPError as exc:
        print(f"[ERROR] Auth request failed: {exc}")
        sys.exit(1)


def fetch_monolith(base_url: str, path: str) -> list:
    """Fetch data from the monolith (skip SSL verification for self-signed cert)."""
    url = f"{base_url}{path}"
    try:
        resp = requests.get(url, verify=False, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        print(f"[WARN] Cannot connect to monolith at {url}")
        return []
    except requests.exceptions.HTTPError as exc:
        print(f"[WARN] Monolith request failed for {path}: {exc}")
        return []


def fetch_microservices(base_url: str, path: str, token: str) -> list:
    """Fetch data from the microservices gateway with JWT auth."""
    url = f"{base_url}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.ConnectionError:
        print(f"[WARN] Cannot connect to microservices at {url}")
        return []
    except requests.exceptions.HTTPError as exc:
        print(f"[WARN] Microservices request failed for {path}: {exc}")
        return []


def normalize_record(record: dict, compare_fields: list) -> dict:
    """Extract only the fields we care about for comparison."""
    normalized = {}
    for field in compare_fields:
        value = record.get(field)
        # Normalize numeric types for consistent comparison
        if isinstance(value, float):
            value = round(value, 2)
        normalized[field] = value
    return normalized


def normalize_key(value) -> str:
    """Normalize a match-key value to a comparable string."""
    if value is None:
        return ""
    return str(value).strip().lower()


def compare_endpoint(
    monolith_data: list,
    micro_data: list,
    match_key: str,
    compare_fields: list,
    entity_name: str,
) -> dict:
    """
    Compare two lists of records by a match key.

    Returns a dict with matched, mismatched, missing_in_micro, missing_in_mono,
    and details for each mismatch.
    """
    mono_map = {}
    for record in monolith_data:
        key = normalize_key(record.get(match_key))
        if key:
            mono_map[key] = record

    micro_map = {}
    for record in micro_data:
        key = normalize_key(record.get(match_key))
        if key:
            micro_map[key] = record

    all_keys = set(mono_map.keys()) | set(micro_map.keys())

    matched = []
    mismatched = []
    missing_in_micro = []
    missing_in_mono = []
    details = []

    for key in sorted(all_keys):
        in_mono = key in mono_map
        in_micro = key in micro_map

        if in_mono and not in_micro:
            missing_in_micro.append(key)
            details.append(
                {"key": key, "status": "missing_in_microservices", "diff": None}
            )
        elif in_micro and not in_mono:
            missing_in_mono.append(key)
            details.append(
                {"key": key, "status": "missing_in_monolith", "diff": None}
            )
        else:
            norm_mono = normalize_record(mono_map[key], compare_fields)
            norm_micro = normalize_record(micro_map[key], compare_fields)

            diff = DeepDiff(
                norm_mono,
                norm_micro,
                ignore_order=True,
                significant_digits=2,
            )

            if diff:
                mismatched.append(key)
                details.append(
                    {
                        "key": key,
                        "status": "mismatched",
                        "diff": json.loads(diff.to_json()),
                    }
                )
            else:
                matched.append(key)

    return {
        "entity": entity_name,
        "monolith_count": len(monolith_data),
        "microservices_count": len(micro_data),
        "matched": matched,
        "mismatched": mismatched,
        "missing_in_microservices": missing_in_micro,
        "missing_in_monolith": missing_in_mono,
        "details": details,
    }


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def print_json_diff(result: dict) -> None:
    """Print a JSON diff summary for a single endpoint comparison."""
    entity = result["entity"]
    print(f"\n{'='*60}")
    print(f"  {entity.upper()} COMPARISON")
    print(f"{'='*60}")
    print(f"  Monolith count:       {result['monolith_count']}")
    print(f"  Microservices count:  {result['microservices_count']}")
    print(f"  Matched:              {len(result['matched'])}")
    print(f"  Mismatched:           {len(result['mismatched'])}")
    print(f"  Missing in micro:     {len(result['missing_in_microservices'])}")
    print(f"  Missing in monolith:  {len(result['missing_in_monolith'])}")

    if result["details"]:
        print(f"\n  Details:")
        print(json.dumps(result["details"], indent=2))


def generate_markdown_report(results: list, report_path: str) -> None:
    """Generate a Markdown summary report."""
    lines = []
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    lines.append("# Comparison Test Report")
    lines.append("")
    lines.append(f"Generated: {timestamp}")
    lines.append("")

    # --- Summary ---
    lines.append("## Summary")
    lines.append("")
    lines.append("| Entity | Monolith | Microservices | Matched | Mismatched | Missing in Micro | Missing in Mono |")
    lines.append("|--------|----------|---------------|---------|------------|------------------|-----------------|")

    all_pass = True
    for r in results:
        matched_count = len(r["matched"])
        mismatched_count = len(r["mismatched"])
        missing_micro = len(r["missing_in_microservices"])
        missing_mono = len(r["missing_in_monolith"])

        if mismatched_count > 0 or missing_micro > 0 or missing_mono > 0:
            all_pass = False

        lines.append(
            f"| {r['entity'].capitalize()} | {r['monolith_count']} | "
            f"{r['microservices_count']} | {matched_count} | "
            f"{mismatched_count} | {missing_micro} | {missing_mono} |"
        )

    lines.append("")

    if all_pass:
        lines.append("**Result: ALL CHECKS PASSED** - Data parity confirmed.")
    else:
        lines.append("**Result: DISCREPANCIES FOUND** - See details below.")

    lines.append("")

    # --- Details per entity ---
    lines.append("## Details")
    lines.append("")

    for r in results:
        entity = r["entity"].capitalize()
        lines.append(f"### {entity}")
        lines.append("")
        lines.append(f"- Monolith records: {r['monolith_count']}")
        lines.append(f"- Microservices records: {r['microservices_count']}")
        lines.append(f"- Matched: {len(r['matched'])}")
        lines.append(f"- Mismatched: {len(r['mismatched'])}")
        lines.append(
            f"- Missing in microservices: {len(r['missing_in_microservices'])}"
        )
        lines.append(
            f"- Missing in monolith: {len(r['missing_in_monolith'])}"
        )
        lines.append("")

        if r["missing_in_microservices"]:
            lines.append("#### Missing in Microservices")
            lines.append("")
            for key in r["missing_in_microservices"]:
                lines.append(f"- `{key}`")
            lines.append("")

        if r["missing_in_monolith"]:
            lines.append("#### Missing in Monolith")
            lines.append("")
            for key in r["missing_in_monolith"]:
                lines.append(f"- `{key}`")
            lines.append("")

        if r["mismatched"]:
            lines.append("#### Mismatched Records")
            lines.append("")
            for detail in r["details"]:
                if detail["status"] == "mismatched":
                    lines.append(f"**{detail['key']}**")
                    lines.append("")
                    lines.append("```json")
                    lines.append(json.dumps(detail["diff"], indent=2))
                    lines.append("```")
                    lines.append("")

        if not r["details"]:
            lines.append("All records matched successfully.")
            lines.append("")

    report_content = "\n".join(lines)

    with open(report_path, "w") as f:
        f.write(report_content)

    print(f"\nReport written to: {report_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    args = parse_args()

    print("=" * 60)
    print("  OrderManager Migration - Comparison Tests")
    print("=" * 60)
    print(f"  Monolith URL:       {args.monolith_url}")
    print(f"  Microservices URL:  {args.microservices_url}")
    print(f"  Auth URL:           {args.auth_url}")
    print()

    # Authenticate with microservices
    if not args.auth_password:
        print("[ERROR] No auth password provided. Set AUTH_PASSWORD env var or use --auth-password.")
        sys.exit(1)
    print("[INFO] Authenticating with microservices...")
    token = get_jwt_token(args.auth_url, args.auth_username, args.auth_password)
    print("[INFO] Authentication successful.")

    results = []

    for entity_name, config in ENDPOINTS.items():
        path = config["path"]
        match_key = config["match_key"]
        compare_fields = config["compare_fields"]

        print(f"\n[INFO] Fetching {entity_name} from monolith...")
        mono_data = fetch_monolith(args.monolith_url, path)

        print(f"[INFO] Fetching {entity_name} from microservices...")
        micro_data = fetch_microservices(args.microservices_url, path, token)

        print(f"[INFO] Comparing {entity_name}...")
        result = compare_endpoint(
            mono_data, micro_data, match_key, compare_fields, entity_name
        )

        print_json_diff(result)
        results.append(result)

    # Generate report
    generate_markdown_report(results, args.report)

    # Determine exit code
    has_discrepancies = any(
        len(r["mismatched"]) > 0
        or len(r["missing_in_microservices"]) > 0
        or len(r["missing_in_monolith"]) > 0
        for r in results
    )

    if has_discrepancies:
        print("\n[RESULT] DISCREPANCIES FOUND - exit code 1")
        sys.exit(1)
    else:
        print("\n[RESULT] ALL CHECKS PASSED - exit code 0")
        sys.exit(0)


if __name__ == "__main__":
    main()
