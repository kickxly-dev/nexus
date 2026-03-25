from __future__ import annotations

import asyncio
import json
import os
import shutil
from typing import AsyncGenerator

_SEVERITY_MAP = {
    "critical": "vuln",
    "high": "vuln",
    "medium": "warn",
    "low": "info",
    "info": "info",
    "unknown": "info",
}

_TEMPLATES_DIR = os.path.expanduser("~/.local/nuclei-templates")


async def nuclei_run(
    target: str, templates: str = "cves,misconfiguration,exposures"
) -> AsyncGenerator:
    yield {"type": "info", "message": f"Checking for nuclei in PATH..."}

    nuclei_path = shutil.which("nuclei")
    if not nuclei_path:
        yield {
            "type": "info",
            "message": (
                "nuclei not found in PATH. Install it:\n"
                "  Go: go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest\n"
                "  Binary releases: https://nuclei.projectdiscovery.io\n"
                "  Docker: docker pull projectdiscovery/nuclei"
            ),
        }
        yield {"type": "done", "message": "nuclei unavailable"}
        return

    yield {"type": "info", "message": f"Found nuclei at {nuclei_path}"}

    # Update templates if directory doesn't exist
    if not os.path.isdir(_TEMPLATES_DIR):
        yield {"type": "info", "message": "Nuclei templates not found — updating templates first..."}
        try:
            update_proc = await asyncio.create_subprocess_exec(
                nuclei_path, "-update-templates", "-silent",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            try:
                await asyncio.wait_for(update_proc.wait(), timeout=120)
                yield {"type": "info", "message": "Templates updated successfully"}
            except asyncio.TimeoutError:
                try:
                    update_proc.kill()
                except Exception:
                    pass
                yield {"type": "warn", "message": "Template update timed out — continuing with existing templates"}
        except Exception as e:
            yield {"type": "warn", "message": f"Template update failed: {e} — continuing anyway"}

    template_tags = [t.strip() for t in templates.split(",") if t.strip()]
    tag_args: list[str] = []
    for tag in template_tags:
        tag_args += ["-tags", tag]

    cmd = [nuclei_path, "-u", target] + tag_args + ["-json", "-silent"]
    yield {"type": "info", "message": f"Running: {' '.join(cmd)}"}

    proc = None
    finding_count = 0
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            async def read_lines() -> AsyncGenerator:
                while True:
                    line_bytes = await proc.stdout.readline()
                    if not line_bytes:
                        break
                    yield line_bytes.decode(errors="replace").rstrip()

            async for line in read_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    info = data.get("info", {})
                    name = info.get("name", data.get("template-id", "unknown"))
                    severity = info.get("severity", "info").lower()
                    description = info.get("description", "")
                    matched_at = data.get("matched-at", target)
                    template_id = data.get("template-id", "")

                    msg = f"[{severity.upper()}] {name}"
                    if template_id:
                        msg += f" ({template_id})"
                    msg += f" → {matched_at}"
                    if description:
                        msg += f"\n  {description}"

                    yield_type = _SEVERITY_MAP.get(severity, "info")
                    yield {"type": yield_type, "message": msg, "severity": severity, "template": template_id}
                    finding_count += 1
                except json.JSONDecodeError:
                    # Non-JSON line — forward as info
                    if line.strip():
                        yield {"type": "info", "message": line}

            await asyncio.wait_for(proc.wait(), timeout=300)

        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            yield {"type": "warn", "message": "nuclei timed out after 300 seconds — partial results shown above"}

    except FileNotFoundError:
        yield {"type": "error", "message": f"Could not execute nuclei at {nuclei_path}"}
    except Exception as e:
        yield {"type": "error", "message": f"Unexpected error running nuclei: {e}"}
    finally:
        if proc and proc.returncode is None:
            try:
                proc.kill()
            except Exception:
                pass

    yield {
        "type": "done",
        "message": f"nuclei scan complete — {finding_count} finding(s) detected",
    }
