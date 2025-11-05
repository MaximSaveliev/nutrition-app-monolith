"""
ASGI entry point for Vercel deployment
"""
from app.main import app

# Vercel requires the app to be named "app" or exported as default
application = app
