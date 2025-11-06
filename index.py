# Vercel Python Serverless Function Entry Point
# This file must be at the root and named index.py for Vercel to detect it

import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import the FastAPI app from backend
from app.main import app

# Vercel will use this as the ASGI application
# No need to rename - Vercel uses 'app' by default
