import json
import csv
import io
from typing import List, Dict, Any


def to_json(results: List[Dict[str, Any]]) -> str:
    return json.dumps(results, indent=2)


def to_csv(results: List[Dict[str, Any]]) -> str:
    if not results:
        return ""
    output = io.StringIO()
    # Flatten nested dicts one level deep
    flat_results = []
    for r in results:
        flat = {}
        for k, v in r.items():
            if isinstance(v, (dict, list)):
                flat[k] = json.dumps(v)
            else:
                flat[k] = v
        flat_results.append(flat)
    writer = csv.DictWriter(output, fieldnames=flat_results[0].keys())
    writer.writeheader()
    writer.writerows(flat_results)
    return output.getvalue()


def to_txt(results: List[Dict[str, Any]]) -> str:
    lines = []
    for r in results:
        if "message" in r:
            lines.append(r["message"])
        else:
            lines.append(json.dumps(r))
    return "\n".join(lines)
