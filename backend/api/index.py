"""
Vercel Serverless Function Entry Point
Exports the FastAPI app for Vercel's Python runtime
"""
from app.main import app

# Vercel requires a 'handler' or 'app' export
handler = app


