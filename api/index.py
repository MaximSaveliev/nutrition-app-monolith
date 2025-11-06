# Main API entry point for Vercel Python runtime
# This file is detected by Vercel and serves as the ASGI application

import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

# Export the FastAPI app - Vercel will use this
handler = app
