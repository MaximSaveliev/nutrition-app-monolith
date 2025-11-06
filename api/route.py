"""
Vercel Serverless Function Entry Point
This file must be at api/route.py for Vercel's Python runtime
"""
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

# Export for Vercel
handler = app
