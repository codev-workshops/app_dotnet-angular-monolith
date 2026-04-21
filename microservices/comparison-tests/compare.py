#!/usr/bin/env python3
"""
OrderManager: Monolith vs Microservices Comparison Test

Compares API responses from the .NET monolith with the Java microservices
to verify data parity during migration.
"""

import argparse
import json
import sys
from datetime import datetime, timezone

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DEFAULT_MONOLITH_URL = "https://localhost:5001"
DEFAULT_MICROSERVICES_URL = "http://localhost:8080"

ENDPOINTS = ["customers", "products", "orders", "inventory"]

COMPARE_FIELDS = {
    "customers": {
        "key": "email",
        "fields": ["name", "email", "phone", "address", "city", "state", "zipCode"],
    },
    "products": {
        "key": "sku",
        "fields": ["name", "description", "category", "price", "sku"],
    },
    "inventory": {
        "key": "productId",
        "fields": [
            "productId",
            "quantityOnHand",
            "reorderLevel",
            "warehouseLocation",
        ],
    },
    "orders": {
        "key": None,
        "fields": [],
    },
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Compare monolith and microservices API responses"
    )
    parser.add_argument(
        "--monolith-url",
        default=DEFAULT_MONOLITH_URL,
        help=f"Monolith base URL (default: {DEFAULT_MONOLITH_URL})",
    )
    parser.add_argument(
        "--microservices-url",
        default=DEFAULT_MICROSERVICES_URL,
        help=f"Microservices gateway base URL (default: {DEFAULT_MICROSERVICES_URL})",
    )
    return parser.parse_args()


def fetch_monolith_data(base_url):
    """Fetch data from the monolith API (no auth required)."""
    results = {}
    for endpoint in ENDPOINTS:
        url = f"{base_url}/api/{endpoint}"
        try:
            resp = requests.get(url, verify=False, timeout=30)
            resp.raise_for_status()
            results[endpoint] = {"status": "ok", "data": resp.json()}
        except requests.ConnectionError:
            results[endpoint] = {
                "status": "error",
                "error": f"Connection refused — is the monolith running at {base_url}?",
                "data": [],
            }
        except requests.Timeout:
            results[endpoint] = {
                "status": "error",
                "error": f"Request timed out for {url}",
                "data": [],
            }
        except requests.HTTPError as exc:
            results[endpoint] = {
                "status": "error",
                "error": f"HTTP {exc.response.status_code} from {url}",
                "data": [],
            }
        except Exception as exc:
            results[endpoint] = {
                "status": "error",
                "error": str(exc),
                "data": [],
            }
    return results


def login_microservices(base_url):
    """Authenticate with the microservices gateway and return a JWT token."""
    url = f"{base_url}/api/auth/login"
    payload = {"username": "admin", "password": "admin123"}
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        body = resp.json()
        token = body.get("token") or body.get("access_token") or body.get("jwt")
        if not token:
            return None, f"Login succeeded but no token found in response: {body}"
        return token, None
    except requests.ConnectionError:
        return None, f"Connection refused — is the API gateway running at {base_url}?"
    except requests.Timeout:
        return None, f"Login request timed out for {url}"
    except requests.HTTPError as exc:
        return None, f"Login failed with HTTP {exc.response.status_code}: {exc.response.text}"
    except Exception as exc:
        return None, str(exc)


def fetch_microservices_data(base_url, token):
    """Fetch data from the microservices API gateway (JWT required)."""
    headers = {"Authorization": f"Bearer {token}"}
    results = {}
    for endpoint in ENDPOINTS:
        url = f"{base_url}/api/{endpoint}"
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            results[endpoint] = {"status": "ok", "data": resp.json()}
        except requests.ConnectionError:
            results[endpoint] = {
                "status": "error",
                "error": f"Connection refused — is the gateway running at {base_url}?",
                "data": [],
            }
        except requests.Timeout:
            results[endpoint] = {
                "status": "error",
                "error": f"Request timed out for {url}",
                "data": [],
            }
        except requests.HTTPError as exc:
            results[endpoint] = {
                "status": "error",
                "error": f"HTTP {exc.response.status_code} from {url}",
                "data": [],
            }
        except Exception as exc:
            results[endpoint] = {
                "status": "error",
                "error": str(exc),
                "data": [],
            }
    return results


def normalize_value(val):
    """Normalize a value for comparison (handle type differences)."""
    if val is None:
        return ""
    if isinstance(val, float):
        return round(val, 2)
    if isinstance(val, str):
        return val.strip()
    return val


def compare_records(monolith_records, micro_records, endpoint):
    """Compare records from both systems for a given endpoint."""
    config = COMPARE_FIELDS.get(endpoint)
    if not config or config["key"] is None:
        return {
            "skipped": True,
            "reason": "No comparison key defined (e.g., orders may differ)",
            "monolith_count": len(monolith_records),
            "microservices_count": len(micro_records),
        }

    key_field = config["key"]
    fields = config["fields"]

    mono_by_key = {}
    for record in monolith_records:
        k = normalize_value(record.get(key_field))
        if k:
            mono_by_key[k] = record

    micro_by_key = {}
    for record in micro_records:
        k = normalize_value(record.get(key_field))
        if k:
            micro_by_key[k] = record

    all_keys = sorted(set(list(mono_by_key.keys()) + list(micro_by_key.keys())))

    field_comparisons = []
    discrepancies = []

    for key_val in all_keys:
        mono_rec = mono_by_key.get(key_val)
        micro_rec = micro_by_key.get(key_val)

        if mono_rec is None:
            discrepancies.append(
                f"{key_field}={key_val}: present in microservices but missing from monolith"
            )
            continue
        if micro_rec is None:
            discrepancies.append(
                f"{key_field}={key_val}: present in monolith but missing from microservices"
            )
            continue

        row = {"key": key_val}
        for field in fields:
            mono_val = normalize_value(mono_rec.get(field))
            micro_val = normalize_value(micro_rec.get(field))
            match = mono_val == micro_val
            row[field] = {
                "monolith": mono_val,
                "microservices": micro_val,
                "match": match,
            }
            if not match:
                discrepancies.append(
                    f"{key_field}={key_val}, field '{field}': "
                    f"monolith={mono_val!r} vs microservices={micro_val!r}"
                )

        field_comparisons.append(row)

    return {
        "skipped": False,
        "monolith_count": len(monolith_records),
        "microservices_count": len(micro_records),
        "count_match": len(monolith_records) == len(micro_records),
        "records_compared": len(field_comparisons),
        "field_comparisons": field_comparisons,
        "discrepancies": discrepancies,
    }


def build_report(monolith_data, micro_data, comparisons, login_error):
    """Build the structured report dict."""
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": [],
        "comparisons": {},
        "all_discrepancies": [],
        "login_error": login_error,
        "overall_pass": True,
    }

    for endpoint in ENDPOINTS:
        mono = monolith_data.get(endpoint, {})
        micro = micro_data.get(endpoint, {})
        comp = comparisons.get(endpoint, {})

        mono_count = len(mono.get("data", []))
        micro_count = len(micro.get("data", []))

        mono_error = mono.get("error")
        micro_error = micro.get("error")

        if mono_error or micro_error:
            match_str = "ERROR"
            report["overall_pass"] = False
        elif comp.get("skipped"):
            match_str = "SKIPPED"
        elif comp.get("count_match") and not comp.get("discrepancies"):
            match_str = "YES"
        else:
            match_str = "NO"
            report["overall_pass"] = False

        report["summary"].append(
            {
                "endpoint": f"/api/{endpoint}",
                "monolith_count": mono_count,
                "microservices_count": micro_count,
                "match": match_str,
                "monolith_error": mono_error,
                "microservices_error": micro_error,
            }
        )

        report["comparisons"][endpoint] = comp

        if comp and not comp.get("skipped"):
            for d in comp.get("discrepancies", []):
                report["all_discrepancies"].append(f"[{endpoint}] {d}")

    if login_error:
        report["overall_pass"] = False

    return report


def write_json_report(report, path="comparison-report.json"):
    """Write the structured JSON report."""
    with open(path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"  JSON report written to {path}")


def write_markdown_report(report, path="comparison-report.md"):
    """Write the human-readable Markdown report."""
    lines = []
    lines.append("# OrderManager: Monolith vs Microservices Comparison Report")
    lines.append("")
    lines.append(f"**Generated:** {report['timestamp']}")
    lines.append("")

    if report.get("login_error"):
        lines.append("## Authentication Error")
        lines.append("")
        lines.append(f"> {report['login_error']}")
        lines.append("")

    # Summary table
    lines.append("## Summary")
    lines.append("")
    lines.append(
        "| Endpoint | Monolith Count | Microservices Count | Match |"
    )
    lines.append(
        "|----------|---------------|-------------------|-------|"
    )
    for row in report["summary"]:
        lines.append(
            f"| {row['endpoint']} | {row['monolith_count']} "
            f"| {row['microservices_count']} | {row['match']} |"
        )
    lines.append("")

    # Connection errors
    errors = [
        row
        for row in report["summary"]
        if row.get("monolith_error") or row.get("microservices_error")
    ]
    if errors:
        lines.append("## Connection Errors")
        lines.append("")
        for row in errors:
            if row.get("monolith_error"):
                lines.append(
                    f"- **{row['endpoint']}** (monolith): {row['monolith_error']}"
                )
            if row.get("microservices_error"):
                lines.append(
                    f"- **{row['endpoint']}** (microservices): {row['microservices_error']}"
                )
        lines.append("")

    # Detailed comparisons
    lines.append("## Detailed Comparisons")
    lines.append("")

    for endpoint in ENDPOINTS:
        comp = report["comparisons"].get(endpoint, {})
        lines.append(f"### {endpoint.capitalize()}")
        lines.append("")

        if comp.get("skipped"):
            lines.append(f"*Skipped:* {comp.get('reason', 'N/A')}")
            lines.append("")
            lines.append(
                f"- Monolith records: {comp.get('monolith_count', 0)}"
            )
            lines.append(
                f"- Microservices records: {comp.get('microservices_count', 0)}"
            )
            lines.append("")
            continue

        if not comp.get("field_comparisons"):
            lines.append("*No records to compare.*")
            lines.append("")
            continue

        config = COMPARE_FIELDS.get(endpoint, {})
        fields = config.get("fields", [])
        key_field = config.get("key", "key")

        # Build comparison table
        header = f"| {key_field} | Field | Monolith | Microservices | Match |"
        separator = "|" + "|".join(["---"] * 5) + "|"
        lines.append(header)
        lines.append(separator)

        for row in comp["field_comparisons"]:
            key_val = row["key"]
            first_field = True
            for field in fields:
                field_data = row.get(field, {})
                mono_val = field_data.get("monolith", "")
                micro_val = field_data.get("microservices", "")
                match = "YES" if field_data.get("match") else "NO"
                display_key = key_val if first_field else ""
                lines.append(
                    f"| {display_key} | {field} | {mono_val} | {micro_val} | {match} |"
                )
                first_field = False

        lines.append("")

    # Discrepancies
    lines.append("## Discrepancies")
    lines.append("")
    if report["all_discrepancies"]:
        for d in report["all_discrepancies"]:
            lines.append(f"- {d}")
    else:
        lines.append("No discrepancies found.")
    lines.append("")

    # Conclusion
    lines.append("## Conclusion")
    lines.append("")
    if report["overall_pass"]:
        lines.append(
            "**PASS** — All compared endpoints show matching data between "
            "the monolith and microservices."
        )
    else:
        disc_count = len(report["all_discrepancies"])
        lines.append(
            f"**FAIL** — {disc_count} discrepanc{'y' if disc_count == 1 else 'ies'} "
            f"found between the monolith and microservices."
        )
        if report.get("login_error"):
            lines.append(
                "Additionally, authentication to the microservices gateway failed."
            )
    lines.append("")

    with open(path, "w") as f:
        f.write("\n".join(lines))
    print(f"  Markdown report written to {path}")


def main():
    args = parse_args()
    monolith_url = args.monolith_url.rstrip("/")
    microservices_url = args.microservices_url.rstrip("/")

    print("=" * 60)
    print("OrderManager: Monolith vs Microservices Comparison")
    print("=" * 60)
    print(f"  Monolith URL:      {monolith_url}")
    print(f"  Microservices URL: {microservices_url}")
    print()

    # 1. Fetch monolith data
    print("[1/4] Fetching monolith data...")
    monolith_data = fetch_monolith_data(monolith_url)
    for ep, result in monolith_data.items():
        status = result["status"]
        count = len(result.get("data", []))
        if status == "ok":
            print(f"  /api/{ep}: {count} records")
        else:
            print(f"  /api/{ep}: ERROR — {result['error']}")
    print()

    # 2. Login to microservices
    print("[2/4] Authenticating with microservices gateway...")
    token, login_error = login_microservices(microservices_url)
    if login_error:
        print(f"  ERROR: {login_error}")
    else:
        print("  Login successful, JWT obtained.")
    print()

    # 3. Fetch microservices data
    micro_data = {}
    if token:
        print("[3/4] Fetching microservices data...")
        micro_data = fetch_microservices_data(microservices_url, token)
        for ep, result in micro_data.items():
            status = result["status"]
            count = len(result.get("data", []))
            if status == "ok":
                print(f"  /api/{ep}: {count} records")
            else:
                print(f"  /api/{ep}: ERROR — {result['error']}")
    else:
        print("[3/4] Skipping microservices data fetch (no auth token).")
        for ep in ENDPOINTS:
            micro_data[ep] = {
                "status": "error",
                "error": "Skipped — authentication failed",
                "data": [],
            }
    print()

    # 4. Compare
    print("[4/4] Comparing data...")
    comparisons = {}
    for endpoint in ENDPOINTS:
        mono_records = monolith_data.get(endpoint, {}).get("data", [])
        micro_records = micro_data.get(endpoint, {}).get("data", [])
        comparisons[endpoint] = compare_records(mono_records, micro_records, endpoint)
        comp = comparisons[endpoint]
        if comp.get("skipped"):
            print(f"  {endpoint}: SKIPPED ({comp.get('reason')})")
        elif comp.get("discrepancies"):
            print(f"  {endpoint}: {len(comp['discrepancies'])} discrepancies")
        else:
            print(f"  {endpoint}: MATCH")
    print()

    # Build and write reports
    report = build_report(monolith_data, micro_data, comparisons, login_error)

    print("Writing reports...")
    write_json_report(report)
    write_markdown_report(report)
    print()

    if report["overall_pass"]:
        print("RESULT: PASS")
        sys.exit(0)
    else:
        print("RESULT: FAIL")
        sys.exit(1)


if __name__ == "__main__":
    main()
