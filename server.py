#!/usr/bin/env python3
import os
from pathlib import Path

try:
    from aiohttp import web
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "aiohttp"])
    from aiohttp import web

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = Path(__file__).parent

async def index_handler(request):
    return web.FileResponse(BASE_DIR / "index.html")

def create_app():
    app = web.Application()
    app.router.add_get("/", index_handler)
    app.router.add_get("/index.html", index_handler)
    app.router.add_static("/", BASE_DIR, show_index=False)
    return app

if __name__ == "__main__":
    print(f"Starting Fitness Tracker on port {PORT}")
    app = create_app()
    web.run_app(app, host="0.0.0.0", port=PORT)
