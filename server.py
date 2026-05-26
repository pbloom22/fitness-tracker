#!/usr/bin/env python3
import os
import json
import base64
from pathlib import Path

try:
    from aiohttp import web
    import aiohttp
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "aiohttp"])
    from aiohttp import web
    import aiohttp

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = Path(__file__).parent
GITHUB_REPO = "pbloom22/fitness-tracker"
EXERCISES_FILE = "exercises.json"

async def index_handler(request):
    return web.FileResponse(BASE_DIR / "index.html")

async def add_exercise_handler(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({'error': 'Invalid JSON'}, status=400)

    category = data.get('category', '').strip()
    exercise = data.get('exercise', '').strip()

    if not category or not exercise:
        return web.json_response({'error': 'Missing category or exercise'}, status=400)

    github_token = os.environ.get('GITHUB_TOKEN')
    if not github_token:
        return web.json_response({'error': 'GITHUB_TOKEN not configured'}, status=500)

    api_url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{EXERCISES_FILE}'
    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'fitness-tracker-app'
    }

    try:
        async with aiohttp.ClientSession() as session:
            # Fetch current exercises.json from GitHub
            async with session.get(api_url, headers=headers) as resp:
                if resp.status != 200:
                    return web.json_response(
                        {'error': f'GitHub fetch failed: {resp.status}'}, status=500)
                file_data = await resp.json()

            sha = file_data['sha']
            content = json.loads(base64.b64decode(file_data['content']).decode('utf-8'))

            # Add exercise if not already present
            if category not in content:
                content[category] = []
            if exercise in content[category]:
                return web.json_response({'success': True, 'message': 'Already exists'})

            content[category].append(exercise)
            content[category].sort()

            # Commit updated file back to GitHub
            new_content_b64 = base64.b64encode(
                json.dumps(content, indent=2).encode('utf-8')
            ).decode('utf-8')

            payload = {
                'message': f'Add {exercise} to {category}',
                'content': new_content_b64,
                'sha': sha
            }

            async with session.put(api_url, headers=headers, json=payload) as resp:
                if resp.status not in (200, 201):
                    return web.json_response(
                        {'error': f'GitHub commit failed: {resp.status}'}, status=500)

        return web.json_response({'success': True})

    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)

def create_app():
    app = web.Application()
    app.router.add_get("/", index_handler)
    app.router.add_get("/index.html", index_handler)
    app.router.add_post("/api/add-exercise", add_exercise_handler)
    app.router.add_static("/", BASE_DIR, show_index=False)
    return app

if __name__ == "__main__":
    print(f"Starting Fitness Tracker on port {PORT}")
    app = create_app()
    web.run_app(app, host="0.0.0.0", port=PORT)
