#!/usr/bin/env python3
"""
Golden output oracle verifier.

Usage: python3 tests/verify_golden_output.py <new_payload_js_or_json>

After every atomic refactor step, run this script against the new backend output.
Any value that differs from the baseline is a regression.

The baseline is: tests/golden_output_baseline.json
"""

import sys, json, re, unicodedata

import os as _os
BASELINE_PATH = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), 'golden_output_baseline.json')
TOLERANCE = 0.001  # numeric values must match within this tolerance


def load_payload(path):
    with open(path, encoding='utf-8') as f:
        content = f.read()
    # Handle JS fixture files
    if path.endswith('.js'):
        match = re.search(r'window\.__CODIVIUM_DASHBOARD_DATA__\s*=\s*(\{.*\});?\s*$',
                          content, re.DOTALL)
        if not match:
            raise ValueError(f"Could not find payload in {path}")
        content = match.group(1)
    return json.loads(content)


def extract_comparable(payload):
    """Extract the same fields as the golden baseline."""
    return {
        "overall_metrics": payload["overall"]["metrics"],
        "breadth_by_track": {
            "micro":            payload["micro"]["metrics"].get("breadth"),
            "interview":        payload["interview"]["metrics"].get("breadth"),
            "mcq":              payload["mcq"]["metrics"].get("breadth"),
            "weighted_mcq_score": payload["mcq"]["metrics"].get("weightedMcqScore"),
        },
        "depth_by_category_combined": {
            row["category"]: row["depth"]
            for row in payload["combinedCoding"].get("depthByCategory", [])
        },
        "depth_by_category_micro": {
            row["category"]: row["depth"]
            for row in payload["micro"].get("depthByCategory", [])
        },
        "depth_by_category_interview": {
            row["category"]: row["depth"]
            for row in payload["interview"].get("depthByCategory", [])
        },
        "depth_avg_by_track": {
            "micro":     payload["micro"].get("depthAvg"),
            "interview": payload["interview"].get("depthAvg"),
            "combined":  payload["combinedCoding"].get("depthAvg"),
        },
        "allocation_combined": {
            row["category"]: {"minutes": row["minutes"], "solved": row["solved"]}
            for row in payload["combinedCoding"].get("allocation", [])
        },
        "heatmap_combined": {
            "categories": payload["combinedCoding"]["convergenceHeatmap"]["categories"],
            "buckets":    payload["combinedCoding"]["convergenceHeatmap"]["buckets"],
            "values":     payload["combinedCoding"]["convergenceHeatmap"]["values"],
            "counts":     payload["combinedCoding"]["convergenceHeatmap"]["counts"],
        },
        "heatmap_focus_rankings": payload["combinedCoding"]["convergenceHeatmap"].get(
            "focus", {}).get("rankings", {}),
        "heatmap_focus_default_mode": payload["combinedCoding"]["convergenceHeatmap"].get(
            "focus", {}).get("defaultModeId"),
        "time_on_platform_total_minutes": sum(
            d["minutes"] for d in payload["overall"]["timeOnPlatform"]["daily"]),
        "mcq_by_difficulty": payload["mcq"]["mcq"].get("byDifficulty", {}),
        "mcq_overall_correct": payload["mcq"]["mcq"].get("overallCorrect", {}),
        "recommended_actions": [
            {"id": a.get("id"), "panelId": a.get("panelId"), "label": a.get("label")}
            for a in payload["overall"].get("recommendedActions", [])
        ],
        "version": payload.get("version"),
        "heatmap_focus_top_n_default": payload["combinedCoding"]["convergenceHeatmap"].get(
            "focus", {}).get("topNDefault"),
        "time_on_platform_daily_count": len(payload["overall"]["timeOnPlatform"]["daily"]),
        "time_on_platform_daily_first": payload["overall"]["timeOnPlatform"]["daily"][0]
            if payload["overall"]["timeOnPlatform"]["daily"] else None,
        "time_on_platform_daily_last": payload["overall"]["timeOnPlatform"]["daily"][-1]
            if payload["overall"]["timeOnPlatform"]["daily"] else None,
    }


def compare_values(path, baseline_val, new_val, failures):
    if isinstance(baseline_val, dict) and isinstance(new_val, dict):
        for k in set(list(baseline_val.keys()) + list(new_val.keys())):
            compare_values(f"{path}.{k}",
                           baseline_val.get(k), new_val.get(k), failures)
    elif isinstance(baseline_val, list) and isinstance(new_val, list):
        if len(baseline_val) != len(new_val):
            failures.append(f"{path}: list length {len(baseline_val)} → {len(new_val)}")
        else:
            for i, (b, n) in enumerate(zip(baseline_val, new_val)):
                compare_values(f"{path}[{i}]", b, n, failures)
    elif isinstance(baseline_val, (int, float)) and isinstance(new_val, (int, float)):
        if abs(float(baseline_val) - float(new_val)) > TOLERANCE:
            failures.append(
                f"{path}: {baseline_val} → {new_val} (Δ={abs(float(baseline_val)-float(new_val)):.4f})")
    elif isinstance(baseline_val, str) and isinstance(new_val, str):
        # Normalize Unicode (NFC) before comparing so encoding variants don't
        # cause false regressions (e.g. curly quotes, non-breaking hyphens).
        if unicodedata.normalize('NFC', baseline_val) != unicodedata.normalize('NFC', new_val):
            failures.append(f"{path}: {repr(baseline_val)} → {repr(new_val)}")
    elif baseline_val != new_val:
        failures.append(f"{path}: {repr(baseline_val)} → {repr(new_val)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 tests/verify_golden_output.py <new_payload.js|json>")
        sys.exit(1)

    with open(BASELINE_PATH, encoding='utf-8') as f:
        baseline = json.load(f)

    new_payload = load_payload(sys.argv[1])
    new_comparable = extract_comparable(new_payload)

    failures = []
    for key in baseline:
        if key.startswith('_'):
            continue
        compare_values(key, baseline.get(key), new_comparable.get(key), failures)

    if failures:
        print(f"\n❌  REGRESSION DETECTED — {len(failures)} value(s) changed:\n")
        for f in failures:
            print(f"  {f}")
        sys.exit(1)
    else:
        print(f"\n✅  All {sum(1 for k in baseline if not k.startswith('_'))} "
              f"output groups match baseline. No regressions.\n")
        sys.exit(0)


if __name__ == '__main__':
    main()
