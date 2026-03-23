import json
import asyncio
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator, Any


async def _sse_generator(async_gen: AsyncGenerator) -> AsyncGenerator[str, None]:
    try:
        async for item in async_gen:
            yield f"data: {json.dumps(item)}\n\n"
            await asyncio.sleep(0)
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    finally:
        yield f"data: {json.dumps({'type': 'done'})}\n\n"


def stream_response(async_gen: AsyncGenerator) -> StreamingResponse:
    return StreamingResponse(
        _sse_generator(async_gen),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
