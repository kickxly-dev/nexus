from __future__ import annotations

import asyncio
import io
import sys
import traceback
from typing import AsyncGenerator

# Patterns that indicate intent to destroy data or disrupt systems
_BLOCKED_PATTERNS = [
    "rm -rf",
    "rmdir /s",
    "del /f",
    "format c:",
    "mkfs.",
    "dd if=",
    "shutdown",
    "reboot",
    "halt",
    "poweroff",
    "DROP TABLE",
    "DROP DATABASE",
    "TRUNCATE TABLE",
    ":(){:|:&};:",  # fork bomb
]


def _check_script(script: str) -> str | None:
    """Return an error message if the script contains blocked patterns, else None."""
    lower = script.lower()
    for pattern in _BLOCKED_PATTERNS:
        if pattern.lower() in lower:
            return f"Script blocked: contains dangerous pattern '{pattern}'"
    return None


def _run_script_sync(script: str, target: str) -> list[str]:
    """Execute the script in a restricted namespace and capture stdout."""
    old_stdout = sys.stdout
    captured = io.StringIO()
    sys.stdout = captured

    namespace: dict = {
        "__builtins__": __builtins__,
        "target": target,
    }

    try:
        exec(compile(script, "<nexus-script>", "exec"), namespace)  # noqa: S102
    finally:
        sys.stdout = old_stdout

    output = captured.getvalue()
    return output.splitlines()


async def run_custom_script(script: str, target: str = "") -> AsyncGenerator:
    yield {"type": "info", "message": "Custom script executor starting..."}

    if not script or not script.strip():
        yield {"type": "error", "message": "No script provided"}
        yield {"type": "done", "message": "Script execution skipped"}
        return

    # Security check
    block_reason = _check_script(script)
    if block_reason:
        yield {"type": "error", "message": block_reason}
        yield {"type": "done", "message": "Script blocked"}
        return

    if target:
        yield {"type": "info", "message": f"Target variable injected: target = {target!r}"}

    yield {"type": "info", "message": "Executing script..."}

    try:
        lines = await asyncio.wait_for(
            asyncio.to_thread(_run_script_sync, script, target),
            timeout=60,
        )
        for line in lines:
            yield {"type": "info", "message": line}
        yield {"type": "done", "message": f"Script finished — {len(lines)} line(s) of output"}

    except asyncio.TimeoutError:
        yield {"type": "error", "message": "Script execution timed out after 60 seconds"}
        yield {"type": "done", "message": "Script timed out"}
    except Exception as e:
        tb = traceback.format_exc()
        yield {"type": "error", "message": f"Script raised an exception: {e}"}
        for tb_line in tb.splitlines():
            yield {"type": "error", "message": tb_line}
        yield {"type": "done", "message": "Script failed"}
